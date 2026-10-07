import { strict as assert } from 'node:assert'
const types = ['text/html', 'application/json', 'text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', 'application/vnd.api+json', 'image/svg+xml', 'application/octet-stream', 'text/css', 'application/ld+json', 'video/mp4', 'application/vnd.ms-excel']
const charsets = ['utf-8', 'iso-8859-1', 'us-ascii', 'windows-1252']
const tokens = (i) => `----WebKitFormBoundary${(i * 7919).toString(36)}Ab${i}`
const build = (i) => {
  const type = types[i % types.length]
  const kind = i % 6
  const sep = i % 2 === 0 ? '; ' : ';'
  const parameters = {}
  let text = type
  const add = (name, value, quote) => {
    parameters[name] = value
    const q = quote ?? !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(value)
    text += sep + name + '=' + (q ? `"${value.replace(/["\\]/g, '\\$&')}"` : value)
  }
  if (kind === 1 || kind === 4) add('charset', charsets[i % charsets.length])
  if (kind === 2) add('boundary', tokens(i))
  if (kind === 3) add('boundary', `multi part ${i} edge`)
  if (kind === 4) add('format', i % 4 === 0 ? 'flowed' : 'fixed', true)
  if (kind === 5) { add('charset', charsets[i % charsets.length], true); add('version', `${1 + i % 3}.${i % 10}`); add('q', '0.' + (i % 9 + 1)); add('name', `file ${i}.txt`) }
  return { input: text, expected: { type, parameters } }
}
export const cases = Array.from({ length: 48 }, (_, i) => build(i))
const own = (x) => x !== null && typeof x === 'object' && !Array.isArray(x)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(own(out) && own(out.parameters), `fixture ${i}: { type, parameters } required`)
    assert.deepStrictEqual({ type: out.type, parameters: { ...out.parameters } }, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.type.length + Object.keys(value.parameters).length
