import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url))
async function run(adapter, commands) {
  const dir = await mkdtemp(path.join(tmpdir(), 'operation-test-'))
  try {
    await writeFile(path.join(dir, 'adapter.mjs'), adapter)
    const child = spawn(process.execPath, ['--expose-gc', path.join(root, 'harness/js/operation-runner.mjs'), path.join(dir, 'adapter.mjs'), path.join(root, 'benchmarks/deep-equality/nested-json/scenario.mjs')])
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
test('incorrect adapters fail verification before measured work', async () => {
  const result = await run('export const operation = () => true', 'exit\n')
  assert.equal(result.code, 1)
  assert.equal(result.messages.at(-1).phase, 'verify-failed')
  assert.ok(result.messages.at(-1).error)
  assert.ok(!result.messages.some(m => m.phase === 'round'))
})
test('operation protocol records actual adaptive counts and observable output', async () => {
  const result = await run("import { isDeepStrictEqual } from 'node:util'; export const operation = ([a,b]) => isDeepStrictEqual(a,b)", JSON.stringify({ count: 1000, minMs: 30 }) + '\nsettle\nexit\n')
  assert.equal(result.code, 0, result.stderr)
  assert.deepEqual(result.messages.map(m => m.phase), ['boot', 'loaded', 'ready', 'round', 'settled'])
  const round = result.messages[3]
  assert.ok(round.operations >= 1000)
  assert.equal(round.operations % 1000, 0)
  assert.ok(round.wallMs >= 30)
  assert.ok(round.cpuMs > 0)
  assert.ok(round.checksum > 0)
  assert.ok(result.messages[4].memory.heapUsed > 0)
})
