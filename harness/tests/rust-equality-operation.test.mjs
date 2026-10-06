// Build the equality adapter through scripts/measure.mjs first (release-age gated).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cases } from '../../benchmarks/deep-equality/nested-json/scenario.mjs'
const root = fileURLToPath(new URL('../../', import.meta.url))
async function run(adapter, fixtures, commands) {
  const dir = await mkdtemp(path.join(tmpdir(), 'rust-operation-test-'))
  try {
    const file = path.join(dir, 'fixtures.json')
    await writeFile(file, JSON.stringify({ cases: fixtures }))
    const child = spawn(path.join(root, '.cache/cargo-target/release', `deep-equality-${adapter}`), [file])
    let stdout = '', stderr = ''
    child.stdout.on('data', c => stdout += c)
    child.stderr.on('data', c => stderr += c)
    // A program that rejects its input exits before reading the commands; the
    // write then fails with EPIPE, which is expected and not the test's concern.
    child.stdin.on('error', () => {})
    child.stdin.end(commands)
    const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve) })
    return { code, stderr, messages: stdout.trim().split('\n').map(l => JSON.parse(l.slice(2))) }
  } finally { await rm(dir, { recursive: true, force: true }) }
}
test('serde_json PartialEq: shared boolean fixtures and observable checksum', async () => {
  const result = await run('serde-json', cases, JSON.stringify({ count: 1000, minMs: 10 }) + '\nsettle\nexit\n')
  assert.equal(result.code, 0, result.stderr)
  assert.deepEqual(result.messages.map(m => m.phase), ['boot', 'ready', 'round', 'settled'])
  const round = result.messages[2]
  assert.ok(round.wallMs >= 10 && round.cpuMs > 0)
  assert.equal(round.operations % 1000, 0)
  let checksum = 0
  for (let i = 0; i < round.operations; i++) checksum = (checksum + Number(cases[i % cases.length].expected)) >>> 0
  assert.equal(round.checksum, checksum)
})
test('serde_json PartialEq: incorrect expectations fail before timing', async () => {
  const result = await run('serde-json', [{ input: [{ a: 1 }, { a: 2 }], expected: true }], 'exit\n')
  assert.equal(result.code, 1)
  assert.deepEqual(result.messages.map(m => m.phase), ['boot', 'verify-failed'])
})
