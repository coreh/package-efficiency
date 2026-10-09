import { strict as assert } from 'node:assert'
// An input is { records: [{ level, message, fields }] }. `level` is "info",
// "warn" or "error"; `fields` always has the same five keys: user_id (integer),
// route (string), duration_ms (number), cached (boolean) and region (string).
const messages = ['request handled', 'cache miss for "profile"', 'disk 91% full', 'retrying after timeout', 'ünïcödé café', '日本語のメッセージ', 'path C:\\temp\\x', 'two\nlines', 'tab\there', 'a < b && c > d', 'done']
const routes = ['/', '/api/users/42', '/search?q=a&b=c', '/files/日本語.txt', '/say "hi"', '/back\\slash', '/new\nline', '/é/ü']
const regions = ['eu-west-1', 'us-east-2', 'ap-southeast-2', 'sa-east-1', 'São Paulo', '']
const levels = ['info', 'info', 'warn', 'info', 'error', 'info', 'warn']
const record = (seed, i) => {
  const n = seed * 97 + i
  return {
    level: levels[n % levels.length],
    message: messages[(n * 5) % messages.length],
    fields: {
      user_id: (n * 7919) % 1000003,
      route: routes[(n * 3) % routes.length],
      duration_ms: ((n * 37) % 5000) / 8 + 0.25,
      cached: n % 3 === 0,
      region: regions[(n * 2) % regions.length],
    },
  }
}
const sizes = [5, 20, 50, 100, 200, 10, 30, 75, 150, 15, 40, 120]
export const cases = sizes.map((size, s) => ({ input: { records: Array.from({ length: size }, (_, i) => record(s, i)) } }))

// ---- the reader. Each line the sink captured is one JSON object. Libraries
// name things differently, so the reader looks for each thing under the names
// loggers commonly use and compares the content strictly.
const levelKeys = ['level', 'levelname', 'severity', 'lvl', 'levelName', '@level']
const messageKeys = ['message', 'msg', 'event', 'text', '@message']
const nested = ['fields', 'extra', 'properties', 'context', 'data', 'meta', 'attributes', 'mdc', 'args']
const levelNames = { info: 'info', warn: 'warn', warning: 'warn', error: 'error', err: 'error', erro: 'error' }
// The reader never reads a time: a timestamp is whatever key a library puts it
// under, and it is not looked at.
const parseLine = (line, where) => {
  let obj
  try { obj = JSON.parse(line) } catch (e) { assert.fail(`${where}: not JSON: ${JSON.stringify(line.slice(0, 80))}`) }
  assert.ok(obj !== null && typeof obj === 'object' && !Array.isArray(obj), `${where}: not a JSON object`)
  // loguru's `serialize` wraps the record in { text, record }.
  if (obj.record && typeof obj.record === 'object' && typeof obj.text === 'string') obj = obj.record
  return obj
}
const pick = (objects, keys) => {
  for (const o of objects) for (const k of keys) if (Object.hasOwn(o, k)) return o[k]
  return undefined
}
export const readRecord = (line, where) => {
  const top = parseLine(line, where)
  const objects = [top, ...nested.filter((k) => top[k] && typeof top[k] === 'object' && !Array.isArray(top[k])).map((k) => top[k])]
  let level = pick([top], levelKeys)
  if (level && typeof level === 'object') level = level.name
  assert.equal(typeof level, 'string', `${where}: no level`)
  const known = levelNames[level.toLowerCase()]
  assert.ok(known, `${where}: unknown level ${level}`)
  const message = pick(objects, messageKeys)
  assert.equal(typeof message, 'string', `${where}: no message`)
  const fields = {}
  for (const k of ['user_id', 'route', 'duration_ms', 'cached', 'region']) {
    const holders = objects.filter((o) => Object.hasOwn(o, k))
    assert.ok(holders.length > 0, `${where}: field ${k} missing`)
    fields[k] = holders[0][k]
  }
  return { level: known, message, fields }
}
export const verifyOne = (i, output) => {
  assert.equal(typeof output, 'string', `fixture ${i}: a string is required`)
  const want = cases[i].input.records
  const lines = output.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  assert.equal(lines.length, want.length, `fixture ${i}: number of lines`)
  lines.forEach((line, j) => {
    const where = `fixture ${i} record ${j}`
    const got = readRecord(line, where)
    assert.equal(got.level, want[j].level, `${where}: level`)
    assert.equal(got.message, want[j].message, `${where}: message`)
    assert.deepEqual(got.fields, want[j].fields, `${where}: fields`)
  })
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// The check must be able to fail: plain text lines, lines without the fields,
// and lines with a wrong level or an altered value are all refused.
{
  const good = cases[0].input.records.map((r) => JSON.stringify({ level: r.level, time: 1, msg: r.message, ...r.fields })).join('\n') + '\n'
  verifyOne(0, good)
  const bad = (text) => assert.throws(() => verifyOne(0, text))
  const r0 = cases[0].input.records[0]
  bad(cases[0].input.records.map((r) => `${r.level}: ${r.message}`).join('\n'))
  bad(good.split('\n').slice(1).join('\n'))
  bad(cases[0].input.records.map((r) => JSON.stringify({ level: r.level, msg: r.message })).join('\n'))
  bad(good.replace(r0.message, 'x'))
  bad(good.replace(`"level":"${r0.level}"`, '"level":"debug"'))
  bad(good.replace(String(r0.fields.user_id), String(r0.fields.user_id + 1)))
}
