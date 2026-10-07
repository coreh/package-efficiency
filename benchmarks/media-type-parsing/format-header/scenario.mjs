import { strict as assert } from 'node:assert'
const types = ['text/html', 'application/json', 'text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', 'application/vnd.api+json', 'image/svg+xml', 'application/octet-stream', 'text/css', 'application/ld+json', 'video/mp4', 'application/vnd.ms-excel']
const charsets = ['utf-8', 'iso-8859-1', 'us-ascii', 'windows-1252']
const token = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/
const build = (i) => {
  const type = types[i % types.length]
  const kind = i % 8
  const p = {}
  if (kind === 1) p.charset = charsets[i % charsets.length]
  if (kind === 2) p.boundary = `----WebKitFormBoundary${(i * 7919).toString(36)}Ab${i}`
  if (kind === 3) p.boundary = `multi part ${i} edge`
  if (kind === 4) { p.charset = charsets[i % charsets.length]; p.format = i % 3 ? 'flowed' : 'fixed' }
  if (kind === 5) { p.charset = charsets[i % charsets.length]; p.name = `file ${i}.txt`; p.q = '0.' + (i % 9 + 1); p.version = `${1 + i % 3}.${i % 10}` }
  if (kind === 6) { p.filename = `report "${i}" final.pdf`; p.path = `C:\\docs\\${i}` }
  if (kind === 7) { p.profile = `http://example.com/profiles/${i}`; p.title = `a/b ${i}` }
  const parameters = Object.fromEntries(Object.entries(p).sort(([a], [b]) => (a < b ? -1 : 1)))
  // semicolons without a following space
  let expected = type
  for (const [k, v] of Object.entries(parameters)) expected += ';' + k + '=' + (token.test(v) ? v : `"${v.replace(/["\\]/g, '\\$&')}"`)
  return { input: { type, parameters }, expected }
}
export const cases = Array.from({ length: 48 }, (_, i) => build(i))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.equal(typeof out, 'string', `fixture ${i}: a string is required`)
    assert.equal(out.replace(/; (?=[!#$%&'*+.^_`|~0-9a-z-]+=)/g, ';'), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
