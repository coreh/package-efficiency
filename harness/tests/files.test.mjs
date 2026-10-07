// Fixture files for tasks on the file system (harness/files.mjs), and the
// reset every runner does before each operation when BENCH_FILES_RESET is set.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { mkdtemp, writeFile, rm, copyFile, readFile } from 'node:fs/promises'
import { spawn, execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FIXED_MTIME, SCRATCH, announceFiles, filesRoot, fixtureFiles } from '../files.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const config = JSON.parse(await readFile(path.join(root, 'runtimes.json'), 'utf8'))
const TASK = 'harness-test/files'
const scratch = filesRoot(TASK)
const scenario = (extra = {}) => ({
  files: { tree: [{ path: 'in/a.txt', content: 'alpha' }, { path: 'in/bin/run.sh', content: '#!/bin/sh\n', mode: 0o755 }, { path: 'in/data.bin', content: Uint8Array.of(0, 255, 7) }, { path: 'in/empty/' }], reset: ['out'], ...extra.files },
  cases: extra.cases ?? [{ input: { to: `${scratch}/out` } }],
})

test('the scratch directory is under .cache/scratch and named before the scenario is read', () => {
  assert.equal(scratch, path.join(root, '.cache/scratch', TASK))
  assert.ok(scratch.startsWith(SCRATCH + path.sep))
  announceFiles(TASK)
  assert.equal(process.env.BENCH_FILES, scratch)
  assert.throws(() => filesRoot('../elsewhere'), /not a task id/)
})

test('files are created anew around a run and removed after it, even when it fails', async () => {
  const fixtures = fixtureFiles(TASK, scenario())
  assert.deepEqual(JSON.parse(process.env.BENCH_FILES_RESET), [`${scratch}/out`])
  await fixtures.around(() => {
    assert.equal(readFileSync(`${scratch}/in/a.txt`, 'utf8'), 'alpha')
    assert.deepEqual([...readFileSync(`${scratch}/in/data.bin`)], [0, 255, 7])
    assert.equal(statSync(`${scratch}/in/bin/run.sh`).mode & 0o777, 0o755)
    assert.ok(statSync(`${scratch}/in/empty`).isDirectory())
    assert.equal(statSync(`${scratch}/in/a.txt`).mtimeMs, FIXED_MTIME * 1000)
    assert.equal(statSync(`${scratch}/in`).mtimeMs, FIXED_MTIME * 1000)
    writeFileSync(`${scratch}/in/a.txt`, 'spoiled')
    writeFileSync(`${scratch}/stray.txt`, 'left behind')
  })
  assert.ok(!existsSync(scratch))
  // The next run does not see what the last one changed.
  await fixtures.around(() => {
    assert.equal(readFileSync(`${scratch}/in/a.txt`, 'utf8'), 'alpha')
    assert.ok(!existsSync(`${scratch}/stray.txt`))
  })
  await assert.rejects(fixtures.around(() => { throw new Error('adapter crashed') }), /adapter crashed/)
  assert.ok(!existsSync(scratch) && !existsSync(`${scratch}.lock`))
})

test('a declaration or an input that leaves the scratch directory is refused', () => {
  const refuse = (extra, pattern) => assert.throws(() => fixtureFiles(TASK, scenario(extra)), pattern)
  refuse({ files: { tree: [{ path: '../outside.txt', content: '' }] } }, /must not contain/)
  refuse({ files: { tree: [{ path: '/etc/outside.txt', content: '' }] } }, /relative path/)
  refuse({ files: { tree: [{ path: 'in/link', link: '../../outside' }] } }, /leaves the scratch directory/)
  refuse({ files: { tree: [{ path: 'a', content: '' }, { path: 'a/b', content: '' }] } }, /both a file and a directory/)
  refuse({ files: { reset: ['../out'] } }, /must not contain/)
  refuse({ files: { reset: ['in'] } }, /overlaps the declared tree/)
  refuse({ cases: [{ input: { to: '/tmp/elsewhere' } }] }, /outside the task's scratch directory/)
  refuse({ cases: [{ input: { nested: [{ to: `${scratch}/../x` }] } }] }, /must not contain/)
  refuse({ cases: [{ input: { to: `${scratch}-sibling/out` } }] }, /outside the task's scratch directory/)
})

test('a scenario without files gets no scratch directory', async () => {
  const fixtures = fixtureFiles(TASK, { cases: [] })
  assert.equal(process.env.BENCH_FILES, undefined)
  assert.equal(await fixtures.around(() => 7), 7)
  assert.ok(!existsSync(scratch))
})

// Each runner, in reset mode: the operation makes a directory that must not
// exist yet, so it only works if the runner removed it before every call.
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
  const dir = await mkdtemp(path.join(tmpdir(), 'files-test-'))
  try {
    await writeFile(path.join(dir, 'fixtures.json'), JSON.stringify({ cases: scenario().cases }))
    return await fixtures.around(() => work(dir))
  } finally { await rm(dir, { recursive: true, force: true }) }
}

test('the JavaScript runner removes the reset paths before every operation', async () => {
  await withFiles(async (dir) => {
    await writeFile(path.join(dir, 'adapter.mjs'), "import { mkdirSync } from 'node:fs'\nexport const operation = ({ to }) => mkdirSync(to)\n")
    await writeFile(path.join(dir, 'scenario.mjs'), `export const cases = ${JSON.stringify(scenario().cases)}\nexport const verify = () => {}\nexport const consume = () => 1\n`)
    checkRounds(await run(process.execPath, ['--expose-gc', path.join(root, 'harness/js/operation-runner.mjs'), path.join(dir, 'adapter.mjs'), path.join(dir, 'scenario.mjs')], commands(false)))
    // Without the reset the same adapter fails on its second call.
    const plain = await run(process.execPath, ['--expose-gc', path.join(root, 'harness/js/operation-runner.mjs'), path.join(dir, 'adapter.mjs'), path.join(dir, 'scenario.mjs')], commands(false), { BENCH_FILES_RESET: '' })
    assert.notEqual(plain.code, 0)
  })
})

test('a runner refuses a reset path outside the scratch directory', async () => {
  await withFiles(async (dir) => {
    await writeFile(path.join(dir, 'adapter.mjs'), 'export const operation = () => 1\n')
    await writeFile(path.join(dir, 'scenario.mjs'), 'export const cases = [{ input: 1 }]\nexport const verify = () => {}\nexport const consume = () => 1\n')
    const victim = path.join(dir, 'keep')
    mkdirSync(victim)
    const result = await run(process.execPath, ['--expose-gc', path.join(root, 'harness/js/operation-runner.mjs'), path.join(dir, 'adapter.mjs'), path.join(dir, 'scenario.mjs')], commands(false), { BENCH_FILES_RESET: JSON.stringify([victim]) })
    assert.notEqual(result.code, 0)
    assert.ok(existsSync(victim))
  })
})

for (const id of ['cpython', 'pypy']) test(`the Python runner on ${id} removes the reset paths before every operation`, async (t) => {
  const rt = config.runtimes[id], bin = path.resolve(root, rt.bin)
  if (!existsSync(bin)) return t.skip(`${id} is not installed`)
  await withFiles(async (dir) => {
    await writeFile(path.join(dir, 'adapter.py'), "import os\ndef operation(input):\n    os.mkdir(input['to'])\n")
    checkRounds(await run(bin, [...rt.args, path.join(root, 'harness/python/runner.py'), path.join(dir, 'adapter.py'), path.join(dir, 'fixtures.json')], commands(true)))
  })
})

test('the Ruby runner removes the reset paths before every operation', async (t) => {
  const rt = config.runtimes.ruby
  if (!existsSync(rt.bin)) return t.skip('ruby is not installed')
  await withFiles(async (dir) => {
    await writeFile(path.join(dir, 'adapter.rb'), "def operation(input)\n  Dir.mkdir(input['to'])\n  nil\nend\n")
    checkRounds(await run(rt.bin, [...rt.args, path.join(root, 'harness/ruby/runner.rb'), path.join(dir, 'adapter.rb'), path.join(dir, 'fixtures.json')], commands(true)))
  })
})

test('the Go runner removes the reset paths before every operation', async (t) => {
  const go = config.toolchains.go.bin
  if (!existsSync(go)) return t.skip('go is not installed')
  await withFiles(async (dir) => {
    await copyFile(path.join(root, 'harness/go/runner.go'), path.join(dir, 'runner.go'))
    await writeFile(path.join(dir, 'adapter.go'), 'package main\nimport "os"\nfunc prepare(v any) any { return v }\nfunc operation(v any) any {\n if err := os.Mkdir(v.(map[string]any)["to"].(string), 0o755); err != nil { panic(err) }\n return nil\n}\n')
    execFileSync(go, ['build', '-o', path.join(dir, 'runner'), 'runner.go', 'adapter.go'], { cwd: dir, env: { ...process.env, GOCACHE: path.join(root, '.cache/go-build'), GOTOOLCHAIN: 'local' } })
    checkRounds(await run(path.join(dir, 'runner'), [path.join(dir, 'fixtures.json')], commands(true)))
  })
})

// The Rust runner is only reachable through a built adapter. The do-nothing
// one (built by scripts/measure.mjs for any Rust task) shows the removal.
test('the Rust runner removes the reset paths before an operation', async (t) => {
  const bin = path.join(root, '.cache/cargo-target/release/warm-baseline')
  if (!existsSync(bin)) return t.skip('warm-baseline is not built')
  await withFiles(async (dir) => {
    mkdirSync(`${scratch}/out/left/behind`, { recursive: true })
    checkRounds(await run(bin, [path.join(dir, 'fixtures.json')], commands(true)))
    assert.ok(!existsSync(`${scratch}/out`))
    assert.ok(existsSync(`${scratch}/in/a.txt`))
  })
})

test('the walking example refuses a list with an entry missing, repeated or made up', async () => {
  announceFiles('directory-walking/mixed-trees')
  const walking = await import('../../benchmarks/directory-walking/mixed-trees/scenario.mjs')
  delete process.env.BENCH_FILES
  const right = walking.cases.map((c) => c.expected.map((relative) => `${c.input.root}/${relative}`))
  walking.verifyResults(right)
  walking.verifyResults(walking.cases.map((c) => ['.', ...c.expected.map((relative) => `./${relative}`)]))
  const broken = (change) => walking.cases.map((c, i) => (i === 0 ? change([...right[0]]) : right[i]))
  assert.throws(() => walking.verifyResults(broken((list) => list.slice(1))))
  assert.throws(() => walking.verifyResults(broken((list) => [...list, list[0]])))
  assert.throws(() => walking.verifyResults(broken((list) => [...list.slice(1), `${walking.cases[0].input.root}/made-up.txt`])))
  assert.throws(() => walking.verifyResults(broken((list) => list.filter((p) => !p.includes('/.config')))))
})
