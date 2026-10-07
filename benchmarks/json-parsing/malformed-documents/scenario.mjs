import { strict as assert } from 'node:assert'
const record = (i, j) => ({
  id: i * 100 + j,
  name: `User ${i}-${j} éç 日本語`,
  quote: 'He said "hi"\n\tback\\slash',
  active: (i + j) % 2 === 0,
  deleted: null,
  score: (i * 7 + j) / 8,
  tags: ['alpha', 'βeta', 'gamma'.repeat(1 + (j % 3))],
  nested: { scores: [i, j, i + j, -(i + 1)], address: { city: 'São Paulo', zip: `${10000 + i}`, lat: Number((-23.55 - j / 100).toFixed(2)) } },
})
// Replace the nth (wrapping) occurrence of `search` in `text`.
const replaceNth = (text, search, replacement, n) => {
  const count = text.split(search).length - 1
  let at = -1
  for (let k = 0; k <= n % count; k++) at = text.indexOf(search, at + 1)
  return text.slice(0, at) + replacement + text.slice(at + search.length)
}
// Each corruption makes the text invalid JSON for every conforming parser.
const corruptions = [
  (t, n) => t.slice(0, Math.floor(t.length * (0.3 + 0.6 * ((n % 7) / 7)))), // truncated
  (t, n) => replaceNth(t, '],"nested"', ',],"nested"', n), // trailing comma
  (t, n) => replaceNth(t, '"id":', "'id':", n), // single-quoted key
  (t, n) => replaceNth(t, '"name":', 'name:', n), // unquoted key
  (t) => t + '\n]', // trailing garbage
  (t, n) => replaceNth(t, ',"name"', ' "name"', n), // missing comma
  (t, n) => replaceNth(t, '"score":', '"score" ', n), // missing colon
  (t, n) => replaceNth(t, '"deleted":null', '"deleted":nul', n), // broken literal
]
// 40 malformed documents and 8 valid ones. The valid ones are the smallest
// (3 records, about 4% of the text): they are there so that an adapter cannot
// pass by refusing everything, and are kept small so that the figure is the
// cost of rejecting text. Parsing valid text is the standard-documents task.
let malformed = 0
export const cases = Array.from({ length: 48 }, (_, i) => {
  const valid = i % 6 === 0
  const count = valid ? 3 : 3 + (i % 12) * 2
  const data = { page: i, items: Array.from({ length: count }, (_, j) => record(i, j)), next: i % 3 === 0 ? null : `/items?page=${i + 1}` }
  const text = JSON.stringify(data)
  if (valid) return { input: text, expected: data }
  const n = malformed++
  return { input: corruptions[n % corruptions.length](text, n), expected: null }
})
for (const { input, expected } of cases) {
  let parsed = true
  try { JSON.parse(input) } catch { parsed = false }
  assert.equal(parsed, expected !== null, 'a fixture is valid JSON exactly when it has an expected value')
}
const same = (a, b, path) => {
  if (Array.isArray(b)) {
    assert.ok(Array.isArray(a), `${path}: array expected`)
    assert.equal(a.length, b.length, `${path}: length`)
    b.forEach((v, i) => same(a[i], v, `${path}[${i}]`))
  } else if (b !== null && typeof b === 'object') {
    assert.ok(a !== null && typeof a === 'object' && !Array.isArray(a), `${path}: object expected`)
    assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort(), `${path}: keys`)
    for (const k of Object.keys(b)) same(a[k], b[k], `${path}.${k}`)
  } else {
    assert.equal(typeof a, typeof b, `${path}: type`)
    assert.ok(Object.is(a, b), `${path}: ${a} !== ${b}`)
  }
}
// Native runtimes send their outputs here after a JSON round trip.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    if (expected === null) assert.ok(outputs[i] === null, `fixture ${i}: invalid text must give null`)
    else same(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (value === null ? 0 : 1)
