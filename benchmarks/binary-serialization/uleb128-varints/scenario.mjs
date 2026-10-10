import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
const MAX = (1n << 64n) - 1n
// Deterministic xorshift64 generator (BigInt), so fixtures never change.
const generator = (seed) => {
  let x = (BigInt(seed) * 0x9e3779b97f4a7c15n + 0x2545f4914f6cdd1dn) & MAX
  if (x === 0n) x = 1n
  return () => {
    x ^= (x << 13n) & MAX
    x ^= x >> 7n
    x ^= (x << 17n) & MAX
    return x
  }
}
// A value whose unsigned LEB128 encoding is exactly `length` bytes (1 to 10).
const lowOf = (length) => length === 1 ? 0n : 1n << BigInt(7 * (length - 1))
const highOf = (length) => length === 10 ? MAX : (1n << BigInt(7 * length)) - 1n
const withLength = (next, length) => lowOf(length) + next() % (highOf(length) - lowOf(length) + 1n)
const COUNT = 1000
// The scenario's reference: unsigned LEB128, seven bits per byte, low group
// first, the high bit set on every byte but the last, no padding.
const encodeOne = (value, out) => {
  let v = value
  do {
    let byte = Number(v & 0x7fn)
    v >>= 7n
    if (v !== 0n) byte |= 0x80
    out.push(byte)
  } while (v !== 0n)
}
const encode = (values) => {
  const out = []
  for (const v of values) encodeOne(v, out)
  return out
}
// The reference against published examples (Wikipedia's 624485, DWARF's
// table of 2, 127, 128, 129, 130 and 12857), the 10-byte maximum and 2^63.
const hexOf = (values) => Buffer.from(encode(values)).toString('hex')
assert.equal(hexOf([624485n]), 'e58e26')
assert.equal(hexOf([0n]), '00')
assert.equal(hexOf([2n]), '02')
assert.equal(hexOf([127n]), '7f')
assert.equal(hexOf([128n]), '8001')
assert.equal(hexOf([129n]), '8101')
assert.equal(hexOf([130n]), '8201')
assert.equal(hexOf([12857n]), 'b964')
assert.equal(hexOf([1n << 63n]), '80808080808080808001')
assert.equal(hexOf([MAX]), 'ffffffffffffffffff01')

const lengthsOf = (values) => values.map((v) => encode([v]).length)
const fixtures = []
// 0: every length from 1 to 10 equally often, in a shuffled order.
{
  const next = generator(1)
  const lengths = Array.from({ length: COUNT }, (_, i) => 1 + (i % 10))
  for (let i = lengths.length - 1; i > 0; i--) {
    const j = Number(next() % BigInt(i + 1));
    [lengths[i], lengths[j]] = [lengths[j], lengths[i]]
  }
  fixtures.push(lengths.map((n) => withLength(next, n)))
}
// 1: small values dominate, as in real streams (lengths, offsets, field
// tags): the length is 1 with probability 1/2, 2 with 1/4, and so on.
{
  const next = generator(2)
  fixtures.push(Array.from({ length: COUNT }, () => {
    let n = 1
    while (n < 10 && (next() & 1n) === 1n) n++
    return withLength(next, n)
  }))
}
// 2: the edges of every length: 2^(7k) - 1 and 2^(7k) with their
// neighbours, 0, 1, 2^63 - 1, 2^63 and 2^64 - 1, cycled to 1,000 values.
{
  const edges = [0n, 1n, MAX, MAX - 1n, (1n << 63n) - 1n, 1n << 63n]
  for (let k = 1; k <= 9; k++) {
    const p = 1n << BigInt(7 * k)
    edges.push(p - 2n, p - 1n, p, p + 1n)
  }
  fixtures.push(Array.from({ length: COUNT }, (_, i) => edges[i % edges.length]))
}
// 3: only 10-byte values (2^63 and above), which do not fit a signed 64-bit
// integer or a JavaScript number.
{
  const next = generator(4)
  fixtures.push(Array.from({ length: COUNT }, () => withLength(next, 10)))
}
// 4: only 1-byte values (0 to 127).
{
  const next = generator(5)
  fixtures.push(Array.from({ length: COUNT }, () => withLength(next, 1)))
}
// 5: values below 2^32 (1 to 5 bytes), uniform over the 32-bit range, so
// most are 5 bytes long.
{
  const next = generator(6)
  fixtures.push(Array.from({ length: COUNT }, () => next() & 0xffffffffn))
}
for (const values of fixtures) {
  assert.equal(values.length, COUNT)
  for (const v of values) assert.ok(v >= 0n && v <= MAX)
}
// Every length occurs, and the shuffled fixture has each length 100 times.
assert.deepEqual([...new Set(fixtures.flatMap(lengthsOf))].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
assert.deepEqual(lengthsOf(fixtures[0]).reduce((c, n) => (c[n - 1]++, c), Array(10).fill(0)), Array(10).fill(100))

// The input is the list of values as decimal strings, because JSON numbers
// lose precision above 2^53; every adapter's prepare parses it into its
// language's unsigned 64-bit integers once, outside the timed call.
export const cases = fixtures.map((values) => ({
  input: values.map(String),
  expected: [encode(values), values.map(String)],
}))
assert.equal(cases.length, 6)

const bytesOf = (i, x) => {
  if (x instanceof Uint8Array || Array.isArray(x)) return x
  assert.fail(`fixture ${i}: the encoded bytes must be a Uint8Array (or Buffer) or, from a native runner, a list of byte values`)
}
// Decoded values: BigInt in JavaScript, canonical decimal strings from a
// native runner (describe turns its u64 values into text outside timing).
const decimalOf = (i, j, v) => {
  if (typeof v === 'bigint') return v.toString()
  if (typeof v === 'string' && /^(0|[1-9][0-9]*)$/.test(v)) return v
  assert.fail(`fixture ${i}: decoded value ${j} must be a BigInt or a decimal string, not ${typeof v}`)
}
export const verifyOne = (i, output) => {
  assert.ok(Array.isArray(output) && output.length === 2, `fixture ${i}: a pair [encoded bytes, decoded values] is required`)
  const [encoded, decoded] = output
  const [expectedBytes, expectedValues] = cases[i].expected
  const actual = bytesOf(i, encoded)
  assert.equal(actual.length, expectedBytes.length, `fixture ${i}: encoded length`)
  for (let j = 0; j < actual.length; j++) if (actual[j] !== expectedBytes[j]) assert.fail(`fixture ${i}: encoded byte ${j}`)
  assert.ok(Array.isArray(decoded), `fixture ${i}: the decoded values must be a list`)
  assert.equal(decoded.length, expectedValues.length, `fixture ${i}: number of decoded values`)
  for (let j = 0; j < decoded.length; j++) if (decimalOf(i, j, decoded[j]) !== expectedValues[j]) assert.fail(`fixture ${i}: decoded value ${j}`)
}
// Native runners send each output as [list of byte values, list of decimal strings].
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value[0].length + value[1].length

// The check refuses outputs that did not do the job.
const right = fixtures.map((values) => [Uint8Array.from(encode(values)), values.slice()])
verifyResults(right)
verifyResults(cases.map(({ expected }) => expected))
const toNumberLossy = (v) => String(Number(v)) // what a JSON number would carry
const bigEndianGroups = (values) => values.flatMap((v) => {
  const groups = encode([v]).map((b) => b & 0x7f).reverse()
  return groups.map((g, k) => (k < groups.length - 1 ? g | 0x80 : g))
})
const padded = (values) => values.flatMap((v) => {
  const b = encode([v])
  return b.length < 10 ? [...b.slice(0, -1), b.at(-1) | 0x80, 0x00] : b
})
const zigzag = (values) => encode(values.map((v) => ((v << 1n) ^ (v >> 63n ? MAX : 0n)) & MAX))
const wrong = {
  'the input unchanged': cases.map(({ input }) => input),
  'the bytes alone': right.map(([b]) => b),
  'the pair swapped': right.map(([b, v]) => [v, b]),
  'the input strings as the decoded values, bytes empty': right.map(([, v]) => [new Uint8Array(0), v.map(String)]),
  'values as JSON numbers': right.map(([b, v]) => [b, v.map(Number)]),
  'values through a double (precision lost above 2^53)': right.map(([b, v]) => [b, v.map(toNumberLossy)]),
  'values truncated to 32 bits': right.map(([b, v]) => [b, v.map((x) => x & 0xffffffffn)]),
  'values truncated to 63 bits': right.map(([b, v]) => [b, v.map((x) => x & ((1n << 63n) - 1n))]),
  'one value missing': right.map(([b, v]) => [b, v.slice(1)]),
  'values reversed': right.map(([b, v]) => [b, v.slice().reverse()]),
  'groups written high first (BER, Ruby pack "w")': fixtures.map((v) => [Uint8Array.from(bigEndianGroups(v)), v]),
  'one padding byte on short values': fixtures.map((v) => [Uint8Array.from(padded(v)), v]),
  'zigzag (signed) encoding': fixtures.map((v) => [Uint8Array.from(zigzag(v)), v]),
  'bytes one short': right.map(([b, v]) => [b.subarray(0, b.length - 1), v]),
  'the last byte with its high bit set': right.map(([b, v]) => { const c = Uint8Array.from(b); c[c.length - 1] |= 0x80; return [c, v] }),
  "another fixture's pair": right.map((_, i) => right[(i + 1) % right.length]),
  'a constant pair': right.map(() => [Uint8Array.of(0), [0n]]),
}
for (const [name, outputs] of Object.entries(wrong)) assert.throws(() => verifyResults(outputs), undefined, `${name} must be refused`)
