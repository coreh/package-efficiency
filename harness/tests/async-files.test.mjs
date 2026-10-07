// The reset of written fixture files (harness/files.mjs, BENCH_FILES_RESET)
// in the runners of asynchronous operation tasks. Ruby and Go adapters of
// such tasks run on the synchronous runners, which files.test.mjs covers.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync } from 'node:fs'
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { filesRoot, fixtureFiles } from '../files.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const config = JSON.parse(await readFile(path.join(root, 'runtimes.json'), 'utf8'))
const TASK = 'harness-test/async-files'
const scratch = filesRoot(TASK)
const cases = [{ input: { to: `${scratch}/out`, writers: 4 } }]
const scenario = () => ({ files: { tree: [{ path: 'in/a.txt', content: 'alpha' }], reset: ['out'] }, cases })

const commands = (verified) => (verified ? 'verified\n' : '') + JSON.stringify({ count: 3 }) + '\n' + JSON.stringify({ count: 2, minMs: 1 }) + '\nexit\n'
async function run(command, args, input, env) {
  const child = spawn(command, args, { env: { ...process.env, ...env } })
  let stdout = '', stderr = ''
  child.stdout.on('data', c => stdout += c)
  child.stderr.on('data', c => stderr += c)
  child.stdin.on('error', () => {})
  child.stdin.end(input)
  const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve) })
  return { code, stderr, messages: stdout.trim().split('\n').filter(l => l.startsWith('@@')).map(l => JSON.parse(l.slice(2))) }
}
function checkRounds(result) {
  assert.equal(result.code, 0, result.stderr)
  const rounds = result.messages.filter(m => m.phase === 'round')
  assert.equal(rounds.length, 2)
  assert.equal(rounds[0].operations, 3)
  assert.ok(rounds[1].operations >= 2 && rounds[1].wallMs >= 1)
  for (const round of rounds) assert.ok(round.cpuMs >= round.systemCpuMs && round.systemCpuMs >= 0, 'system CPU is reported, within the total')
}
async function withFiles(work) {
  const fixtures = fixtureFiles(TASK, scenario())
  const dir = await mkdtemp(path.join(tmpdir(), 'async-files-test-'))
  try {
    await writeFile(path.join(dir, 'fixtures.json'), JSON.stringify({ cases }))
    return await fixtures.around(() => work(dir))
  } finally { await rm(dir, { recursive: true, force: true }) }
}

// One operation makes a directory that must not exist yet, then several
// writers that are in flight together each make a file in it. So it works
// only if the runner removed the directory before every call, and never
// while a call's writers were still at work.
const JS_ADAPTER = `import { mkdir, writeFile, readdir } from 'node:fs/promises'
export async function operation({ to, writers }) {
  await mkdir(to)
  await Promise.all(Array.from({ length: writers }, (_, i) => writeFile(to + '/' + i + '.txt', 'x')))
  const made = (await readdir(to)).length
  if (made !== writers) throw new Error('expected ' + writers + ' files, found ' + made)
  return made
}
`
const JS_SCENARIO = `export const cases = ${JSON.stringify(cases)}\nexport const verify = async () => {}\nexport const consume = (made) => made\n`
const jsRunner = path.join(root, 'harness/js/async-operation-runner.mjs')

test('the asynchronous JavaScript runner removes the reset paths before every awaited operation', async () => {
  await withFiles(async (dir) => {
    await writeFile(path.join(dir, 'adapter.mjs'), JS_ADAPTER)
    await writeFile(path.join(dir, 'scenario.mjs'), JS_SCENARIO)
    const args = ['--expose-gc', jsRunner, path.join(dir, 'adapter.mjs'), path.join(dir, 'scenario.mjs')]
    const result = await run(process.execPath, args, commands(false))
    checkRounds(result)
    // Every operation of both rounds saw all of its writers' files.
    assert.equal(result.messages.find(m => m.phase === 'round').checksum, 3 * cases[0].input.writers)
    // Without the reset (as the warm baseline is run) the same adapter fails on its second call.
    const plain = await run(process.execPath, args, commands(false), { BENCH_FILES_RESET: '' })
    assert.notEqual(plain.code, 0)
  })
})

test('the asynchronous JavaScript runner refuses a reset path outside the scratch directory', async () => {
  await withFiles(async (dir) => {
    await writeFile(path.join(dir, 'adapter.mjs'), 'export const operation = async () => 1\n')
    await writeFile(path.join(dir, 'scenario.mjs'), 'export const cases = [{ input: 1 }]\nexport const verify = async () => {}\nexport const consume = () => 1\n')
    const victim = path.join(dir, 'keep')
    mkdirSync(victim)
    const result = await run(process.execPath, ['--expose-gc', jsRunner, path.join(dir, 'adapter.mjs'), path.join(dir, 'scenario.mjs')], commands(false), { BENCH_FILES_RESET: JSON.stringify([victim]) })
    assert.notEqual(result.code, 0)
    assert.ok(existsSync(victim))
  })
})

const PY_AWAITED = `import asyncio, os
async def operation(input):
    os.mkdir(input['to'])
    async def write(i):
        await asyncio.sleep(0)
        open(input['to'] + '/' + str(i) + '.txt', 'w').close()
    await asyncio.gather(*[write(i) for i in range(input['writers'])])
    return os.listdir(input['to'])
`
const PY_THREADS = `import os, threading
def operation(input):
    os.mkdir(input['to'])
    threads = [threading.Thread(target=lambda i=i: open(input['to'] + '/' + str(i) + '.txt', 'w').close()) for i in range(input['writers'])]
    for t in threads: t.start()
    for t in threads: t.join()
    return os.listdir(input['to'])
`
for (const id of ['cpython', 'pypy']) for (const [shape, source] of [['an awaited', PY_AWAITED], ['a blocking']].map(([s, a]) => [s, a ?? PY_THREADS])) {
  test(`the asynchronous Python runner on ${id} removes the reset paths before ${shape} operation`, async (t) => {
    const rt = config.runtimes[id], bin = path.resolve(root, rt.bin)
    if (!existsSync(bin)) return t.skip(`${id} is not installed`)
    const runner = path.join(root, 'harness/python/async-runner.py')
    await withFiles(async (dir) => {
      await writeFile(path.join(dir, 'adapter.py'), source)
      const args = [...rt.args, runner, path.join(dir, 'adapter.py'), path.join(dir, 'fixtures.json')]
      // The verification call is the first to write, as in the synchronous
      // runner; the reset then comes before every measured call.
      const result = await run(bin, args, commands(true))
      checkRounds(result)
      assert.equal(result.messages.find(m => m.phase === 'round').checksum, 3 * cases[0].input.writers)
      const plain = await run(bin, args, commands(true), { BENCH_FILES_RESET: '' })
      assert.notEqual(plain.code, 0)
      const victim = path.join(dir, 'keep')
      mkdirSync(victim)
      const refused = await run(bin, args, commands(true), { BENCH_FILES_RESET: JSON.stringify([victim]) })
      assert.notEqual(refused.code, 0)
      assert.ok(existsSync(victim))
    })
  })
}

// The Rust runner is only reachable through a built adapter. The do-nothing
// one (built by scripts/measure.mjs for any Rust adapter of an asynchronous
// task) shows the removal.
test('the asynchronous Rust runner removes the reset paths before an operation', async (t) => {
  const bin = path.join(root, '.cache/cargo-target/release/async-warm-baseline')
  if (!existsSync(bin)) return t.skip('async-warm-baseline is not built')
  await withFiles(async (dir) => {
    mkdirSync(`${scratch}/out/left/behind`, { recursive: true })
    checkRounds(await run(bin, [path.join(dir, 'fixtures.json')], commands(true)))
    assert.ok(!existsSync(`${scratch}/out`))
    assert.ok(existsSync(`${scratch}/in/a.txt`))
    const victim = path.join(dir, 'keep')
    mkdirSync(victim)
    const refused = await run(bin, [path.join(dir, 'fixtures.json')], commands(true), { BENCH_FILES_RESET: JSON.stringify([victim]) })
    assert.notEqual(refused.code, 0)
    assert.ok(existsSync(victim))
  })
})
