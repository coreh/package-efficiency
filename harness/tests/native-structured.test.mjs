// Native operations may return structured values: the measured loop reads
// only a length, and what the verifier sees is produced before any round.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm, copyFile, readFile } from 'node:fs/promises'
import { spawn, execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url))
const config = JSON.parse(await readFile(path.join(root, 'runtimes.json'), 'utf8'))
const fixtures = [{ input: '[1,2,3]' }, { input: '{"a":1,"b":[true,null]}' }, { input: '[]' }]
const parsed = fixtures.map((c) => JSON.parse(c.input))
const lengths = [3, 2, 0]
const commands = 'verified\n' + JSON.stringify({ count: 300, minMs: 5 }) + '\nexit\n'

async function run(command, args) {
  const child = spawn(command, args)
  let stdout = '', stderr = ''
  child.stdout.on('data', c => stdout += c)
  child.stderr.on('data', c => stderr += c)
  child.stdin.on('error', () => {})
  child.stdin.end(commands)
  const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve) })
  return { code, stderr, messages: stdout.trim().split('\n').map(l => JSON.parse(l.slice(2))) }
}
function check(result, outputs = parsed) {
  assert.equal(result.code, 0, result.stderr)
  const verification = result.messages.find(m => m.phase === 'verification')
  assert.deepEqual(verification.outputs, outputs)
  const round = result.messages.find(m => m.phase === 'round')
  let checksum = 0
  for (let i = 0; i < round.operations; i++) checksum = (checksum + lengths[i % lengths.length]) >>> 0
  assert.equal(round.checksum, checksum)
}
async function inTemp(work) {
  const dir = await mkdtemp(path.join(tmpdir(), 'native-structured-test-'))
  try {
    await writeFile(path.join(dir, 'fixtures.json'), JSON.stringify({ cases: fixtures }))
    return await work(dir)
  } finally { await rm(dir, { recursive: true, force: true }) }
}

test('python: lists and dicts are verified as values and counted by length', () => inTemp(async (dir) => {
  const rt = config.runtimes.cpython
  await writeFile(path.join(dir, 'adapter.py'), 'import json\ndef operation(text):\n    return json.loads(text)\n')
  check(await run(rt.bin, [...rt.args, path.join(root, 'harness/python/runner.py'), path.join(dir, 'adapter.py'), path.join(dir, 'fixtures.json')]))
}))
test('python: describe() turns a library object into JSON outside measured work', () => inTemp(async (dir) => {
  const rt = config.runtimes.cpython
  await writeFile(path.join(dir, 'adapter.py'), 'import json\nclass Box:\n    def __init__(self, v): self.v = v\n    def __len__(self): return len(self.v)\ndef operation(text):\n    return Box(json.loads(text))\ndef describe(box):\n    return box.v\n')
  check(await run(rt.bin, [...rt.args, path.join(root, 'harness/python/runner.py'), path.join(dir, 'adapter.py'), path.join(dir, 'fixtures.json')]))
}))
test('ruby: arrays and hashes are verified as values and counted by length', () => inTemp(async (dir) => {
  const rt = config.runtimes.ruby
  await writeFile(path.join(dir, 'adapter.rb'), "require 'json'\ndef operation(text) = JSON.parse(text)\n")
  check(await run(rt.bin, [...rt.args, path.join(root, 'harness/ruby/runner.rb'), path.join(dir, 'adapter.rb'), path.join(dir, 'fixtures.json')]))
}))
test('ruby: describe() turns a library object into JSON outside measured work', () => inTemp(async (dir) => {
  const rt = config.runtimes.ruby
  await writeFile(path.join(dir, 'adapter.rb'), "require 'json'\nBox = Struct.new(:v)\ndef operation(text) = Box.new(JSON.parse(text))\ndef describe(box) = box.v\n")
  const result = await run(rt.bin, [...rt.args, path.join(root, 'harness/ruby/runner.rb'), path.join(dir, 'adapter.rb'), path.join(dir, 'fixtures.json')])
  assert.equal(result.code, 0, result.stderr)
  assert.deepEqual(result.messages.find(m => m.phase === 'verification').outputs, parsed)
  // An object that is not a string, array or hash counts as one per call.
  const round = result.messages.find(m => m.phase === 'round')
  assert.equal(round.checksum, round.operations)
}))
test('go: slices and maps are verified as values and counted by length', () => inTemp(async (dir) => {
  const rt = config.toolchains.go
  await copyFile(path.join(root, 'harness/go/runner.go'), path.join(dir, 'runner.go'))
  await writeFile(path.join(dir, 'adapter.go'), 'package main\nimport "encoding/json"\nfunc operation(value any) any { var out any; if err:=json.Unmarshal([]byte(value.(string)),&out);err!=nil {panic(err)}; return out }\nfunc prepare(v any) any { return v }\n')
  execFileSync(rt.bin, ['build', '-o', 'runner', 'runner.go', 'adapter.go'], { cwd: dir, env: { ...process.env, GOCACHE: path.join(root, '.cache/go-build'), GOTOOLCHAIN: 'local' } })
  check(await run(path.join(dir, 'runner'), [path.join(dir, 'fixtures.json')]))
}))

// prepare() runs once per fixture before any measured work; the operation is
// then handed its result, so reading the input is not part of a figure.
test('python: prepare() converts each fixture once, outside measured work', () => inTemp(async (dir) => {
  const rt = config.runtimes.cpython
  await writeFile(path.join(dir, 'adapter.py'), 'import json\ncalls = 0\ndef prepare(text):\n    global calls\n    calls += 1\n    assert calls <= 3\n    return json.loads(text)\ndef operation(value):\n    assert not isinstance(value, str)\n    return value\n')
  check(await run(rt.bin, [...rt.args, path.join(root, 'harness/python/runner.py'), path.join(dir, 'adapter.py'), path.join(dir, 'fixtures.json')]))
}))
test('ruby: prepare() converts each fixture once, outside measured work', () => inTemp(async (dir) => {
  const rt = config.runtimes.ruby
  await writeFile(path.join(dir, 'adapter.rb'), "require 'json'\n$calls = 0\ndef prepare(text)\n  raise 'prepared twice' if ($calls += 1) > 3\n  JSON.parse(text)\nend\ndef operation(value)\n  raise 'not prepared' if value.is_a?(String)\n  value\nend\n")
  check(await run(rt.bin, [...rt.args, path.join(root, 'harness/ruby/runner.rb'), path.join(dir, 'adapter.rb'), path.join(dir, 'fixtures.json')]))
}))
test('go: prepare() converts each fixture once, outside measured work', () => inTemp(async (dir) => {
  const rt = config.toolchains.go
  await copyFile(path.join(root, 'harness/go/runner.go'), path.join(dir, 'runner.go'))
  await writeFile(path.join(dir, 'adapter.go'), 'package main\nimport "encoding/json"\nvar calls int\nfunc prepare(value any) any { calls++; if calls>3 {panic("prepared twice")}; var out any; if err:=json.Unmarshal([]byte(value.(string)),&out);err!=nil {panic(err)}; return out }\nfunc operation(value any) any { if _,text:=value.(string);text {panic("not prepared")}; return value }\n')
  execFileSync(rt.bin, ['build', '-o', 'runner', 'runner.go', 'adapter.go'], { cwd: dir, env: { ...process.env, GOCACHE: path.join(root, '.cache/go-build'), GOTOOLCHAIN: 'local' } })
  check(await run(path.join(dir, 'runner'), [path.join(dir, 'fixtures.json')]))
}))
