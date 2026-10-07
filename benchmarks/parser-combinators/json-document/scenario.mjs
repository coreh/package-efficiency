import { strict as assert } from 'node:assert'
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo', 'naïve 😀', '𝄞 clef']
const escapes = ['line\nbreak', 'say "hi"', 'back\\slash', 'tab\there', 'plain', 'Tom & Jerry <b>', 'ctrl\u0001\b\f\r', 'a/b']
const asciiOnly = (text) => text.replace(/[^\x00-\x7f]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
const record = (i, j) => ({
  id: i * 100 + j,
  name: `${words[(i + j) % words.length]} ${j}`,
  note: escapes[(i + j) % escapes.length],
  active: (i + j) % 3 !== 0,
  score: (j + 1) * 1.25 - i,
  ratio: [0.5, -0.125, 1e21, 1.5e-7, 123456789.125][(i + j) % 5],
  big: 9007199254740991 - i,
  neg: -(i * 37 + j),
  parent: j % 4 === 0 ? null : i * 100 + j - 1,
  tags: words.slice(j % 5, j % 5 + 1 + (i % 3)),
  geo: { lat: 10.5 + i, lon: -20.25 - j, path: Array.from({ length: j % 4 }, (_, k) => [k, k * 2.5]) },
})
const doc = (i) => ({
  kind: i % 2 ? 'collection' : 'report',
  version: `${i % 5}.${i % 7}`,
  empty: { list: [], map: {}, text: '' },
  records: Array.from({ length: 1 + i % 14 }, (_, j) => record(i, j)),
  matrix: Array.from({ length: i % 5 }, (_, r) => Array.from({ length: 4 }, (_, c) => r * 4 + c - 3)),
  flags: [true, false, null, i % 2 === 0],
})
const scalars = [0, -1, 17, 3.5, true, false, null, '', 'x', 'é\u0000', [], {}, [[]], [{}], [1, [2, [3, [4, [5]]]]], { a: { b: { c: { d: [] } } } }]
const texts = Array.from({ length: 40 }, (_, i) => {
  if (i < 4) return JSON.stringify(scalars.slice(i * 4, i * 4 + 4))
  const value = doc(i)
  switch (i % 4) {
    case 0: return JSON.stringify(value, null, 2)
    case 1: return JSON.stringify(value)
    case 2: return asciiOnly(JSON.stringify(value, null, '\t'))
    default: return ' \n' + asciiOnly(JSON.stringify(value)) + '\r\n'
  }
})
export const cases = texts.map((input) => ({ input, expected: JSON.parse(input) }))
const plain = (x) => {
  if (Array.isArray(x)) return x.every(plain)
  if (x !== null && typeof x === 'object') return Object.getPrototypeOf(x) === Object.prototype && Object.values(x).every(plain)
  return true
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(plain(out), `fixture ${i}: plain objects and arrays required`)
    assert.deepStrictEqual(out, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => Array.isArray(value) ? value.length : value !== null && typeof value === 'object' ? Object.keys(value).length : 1
