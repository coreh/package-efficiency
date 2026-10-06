// Build the three adapters through scripts/measure.mjs first (release-age gated).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cases } from '../../benchmarks/stable-json-stringify/nested-records/scenario.mjs'
const root = fileURLToPath(new URL('../../', import.meta.url))
const adapters = ['serde-json', 'serde-jcs', 'serde-json-canonicalizer']
async function run(adapter, fixtures, commands) {
  const dir = await mkdtemp(path.join(tmpdir(), 'rust-operation-test-'))
  try {
    const file = path.join(dir, 'fixtures.json')
    await writeFile(file, JSON.stringify({ cases: fixtures }))
    const child = spawn(path.join(root, '.cache/cargo-target/release', `stable-json-${adapter}`), [file])
    let stdout = '', stderr = ''
    child.stdout.on('data', c => stdout += c)
    child.stderr.on('data', c => stderr += c)
    child.stdin.end(commands)
    const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve) })
    return { code, stderr, messages: stdout.trim().split('\n').map(l => JSON.parse(l.slice(2))) }
  } finally { await rm(dir, { recursive: true, force: true }) }
}
for (const adapter of adapters) {
  test(`${adapter}: unsorted shared fixtures, exact outputs, counts and heap`, async () => {
    assert.notDeepEqual(Object.keys(cases[0].input), Object.keys(cases[0].input).sort())
    assert.notDeepEqual(Object.keys(cases[0].input.items[0]), Object.keys(cases[0].input.items[0]).sort())
    const result = await run(adapter, cases, JSON.stringify({ count: 1000, minMs: 10 }) + '\nsettle\nexit\n')
    assert.equal(result.code, 0, result.stderr)
    assert.deepEqual(result.messages.map(m => m.phase), ['boot', 'ready', 'round', 'settled'])
    const round = result.messages[2]
    assert.ok(round.wallMs >= 10 && round.cpuMs > 0)
    assert.equal(round.operations % 1000, 0)
    const lengths = cases.map(c => Buffer.byteLength(c.expected))
    let checksum = 0
    for (let i = 0; i < round.operations; i++) checksum = (checksum + lengths[i % cases.length]) >>> 0
    assert.equal(round.checksum, checksum)
    assert.ok(result.messages[3].memory.heapPeak >= result.messages[3].memory.heapUsed)
  })
  test(`${adapter}: wrong expected bytes are rejected before timing`, async () => {
    const result = await run(adapter, [{ input: { z: 1, a: 2 }, expected: '{"z":1,"a":2}' }], 'exit\n')
    assert.equal(result.code, 1)
    assert.deepEqual(result.messages.map(m => m.phase), ['boot', 'verify-failed'])
    assert.match(result.messages[1].error, /fixture 0/)
  })
}
