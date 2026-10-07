import { strict as assert } from 'node:assert'
const words = ['alpha', 'βeta', 'gamma', 'δelta', 'café', '日本語のテキスト', 'São Paulo', 'naïve 😀 emoji', 'x']
const long = (n, i) => Array.from({ length: n }, (_, k) => words[(i + k) % words.length]).join(' ')
const r3 = (x) => Math.round(x * 1000) / 1000
const record = (i) => ({
  id: i,
  name: `User ${i}`,
  email: `user${i}@example.com`,
  active: i % 2 === 0,
  score: r3(i / 7 + 0.5),
  balance: -1234.5 * (2 * i + 1),
  big: 4294967296 + i * 1000003,
  neg: -(i * 40000) - 1,
  tags: ['alpha', 'βeta', null, words[i % words.length]],
  bio: long(1 + (i % 12), i),
  nested: { scores: [i, i + 1, r3(i / 3 + 0.25), -i - 1], address: { city: 'São Paulo', zip: `${10000 + i}`, geo: [r3(-23.55 - i / 100), r3(-46.63 + i / 100)] }, flags: { a: true, b: false, c: null } },
  empty: { list: [], map: {}, text: '' },
  history: Array.from({ length: i % 6 }, (_, j) => ({ at: 1700000000000 + i * 86400000 + j, kind: ['login', 'logout', 'purchase'][j % 3], amount: j % 3 === 2 ? r3(j * 9.99 + 0.5) : null })),
})
export const cases = Array.from({ length: 40 }, (_, i) => ({ input: record(i) }))
cases.push(
  { input: { n: Array.from({ length: 300 }, (_, i) => i * i - 20000) } },
  { input: { s: Array.from({ length: 40 }, (_, i) => 'item-' + i + 'é') } },
  { input: Object.fromEntries(Array.from({ length: 300 }, (_, i) => ['key' + i, i % 3 === 0 ? null : i])) },
  { input: { text: long(60, 3) + ' ' + 'y'.repeat(300) } },
  { input: { text: 'z'.repeat(70000) } },
  { input: [[[[[[[[[[1, [2, [3, [4]]]]]]]]]]]]] },
  { input: [0, 1, 127, 128, 255, 256, 65535, 65536, 4294967295, 4294967296, -1, -32, -33, -128, -129, -32768, -32769, -2147483648, -2147483649, 9007199254740991, -9007199254740991, 0.5, -0.1, 1e-7, 123456789.125, true, false, null, ''] },
  { input: null },
)
// Objects with a null prototype (some decoders) are accepted and compared by content.
const normal = (x) => {
  if (Array.isArray(x)) return x.map(normal)
  if (x !== null && typeof x === 'object') {
    const proto = Object.getPrototypeOf(x)
    assert.ok(proto === Object.prototype || proto === null, 'plain objects required')
    return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, normal(v)]))
  }
  if (typeof x === 'bigint') return Number(x) // integers beyond 32 bits may decode as BigInt
  assert.ok(x === null || ['string', 'number', 'boolean'].includes(typeof x), 'JSON value types required')
  return x
}
const checkDecoded = (decoded) => {
  assert.ok(Array.isArray(decoded), 'outputs must be an array')
  assert.equal(decoded.length, cases.length, 'one output per fixture is required')
  for (const [i, { input }] of cases.entries()) {
    assert.deepStrictEqual(normal(decoded[i]), input, `fixture ${i}`)
  }
}
// Native adapters (Rust, Python, Ruby): the untimed describe step reports
// { decoded, encodedBytes }. encodedBytes is the length of the byte buffer the
// adapter's encoder produces for the same value, from a second, untimed encode.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  for (const [i, output] of outputs.entries()) {
    assert.ok(output !== null && typeof output === 'object' && !Array.isArray(output) && 'decoded' in output, `fixture ${i}: { decoded, encodedBytes } required`)
    assert.ok(Number.isInteger(output.encodedBytes) && output.encodedBytes > 0, `fixture ${i}: the encoder must produce a non-empty byte buffer`)
  }
  checkDecoded(outputs.map((output) => output.decoded))
}
// JavaScript adapters run in-process, so the result itself is checked: an
// object or array result must be a new value, not the input handed back.
export const verify = (operation) => checkDecoded(cases.map(({ input }, i) => {
  const output = operation(input)
  if (input !== null && typeof input === 'object') assert.notStrictEqual(output, input, `fixture ${i}: the input itself was returned`)
  return output
}))
export const consume = (value) => Array.isArray(value) ? value.length : value !== null && typeof value === 'object' ? Object.keys(value).length : 1
