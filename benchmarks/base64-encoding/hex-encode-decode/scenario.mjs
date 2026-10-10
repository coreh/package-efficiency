import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Deterministic xorshift32 byte generator, so fixtures never change.
const bytes = (n, seed) => {
  let x = (seed * 2654435761 + 12345) >>> 0 || 1
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    x ^= x << 13; x >>>= 0
    x ^= x >>> 17
    x ^= x << 5; x >>>= 0
    out[i] = x & 255
  }
  return out
}
const sizes = []
for (let i = 0; i < 20; i++) sizes.push(32)
for (let n = 0; n <= 10; n++) sizes.push(n)
for (let i = 0; i < 10; i++) sizes.push(100 + i * 89)
for (let i = 0; i < 10; i++) sizes.push(1000 + i * 113)
for (let i = 0; i < 8; i++) sizes.push(2048 + i * 292)
const payloads = sizes.map((n, i) => bytes(n, i + 1))
// Patterned and text-like payloads too, and one with every byte value once,
// so every nibble is written as each of its sixteen digits.
payloads[0].fill(0); payloads[1].fill(255)
payloads[2] = Uint8Array.from(Buffer.from('{"id":12345,"name":"Zoë","ok":true}'.padEnd(32, ' ').slice(0, 32), 'utf8'))
payloads.push(Uint8Array.from({ length: 256 }, (_, i) => i))
// The input is the payload as a list of byte values (not hex, so no adapter
// is handed the text it must produce); every adapter's prepare turns it into
// its language's byte type once, outside the timed call.
export const cases = payloads.map((p) => ({ input: Array.from(p), expected: [Buffer.from(p).toString('hex'), Array.from(p)] }))
assert.equal(cases.length, 60)
const bytesOf = (i, x) => {
  if (x instanceof Uint8Array) return x
  if (Array.isArray(x)) return x
  assert.fail(`fixture ${i}: the decoded bytes must be a Uint8Array (or Buffer) or, from a native runner, a list of byte values`)
}
const check = (i, output) => {
  assert.ok(Array.isArray(output) && output.length === 2, `fixture ${i}: a pair [hex text, decoded bytes] is required`)
  const [text, decoded] = output
  const [expectedText, expectedBytes] = cases[i].expected
  assert.equal(typeof text, 'string', `fixture ${i}: the hex text must be a string`)
  assert.equal(text, expectedText, `fixture ${i}: hex text`)
  const actual = bytesOf(i, decoded)
  assert.equal(actual.length, expectedBytes.length, `fixture ${i}: decoded length`)
  for (let j = 0; j < actual.length; j++) if (actual[j] !== expectedBytes[j]) assert.fail(`fixture ${i}: decoded byte ${j}`)
}
// Native runners send each output as [string, list of byte values].
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) check(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value[0].length + value[1].length
// The check refuses outputs that did not do the job.
const buf = (i) => Buffer.from(cases[i].input)
const right = cases.map((_, i) => [buf(i).toString('hex'), Uint8Array.from(buf(i))])
verifyResults(right)
verifyResults(cases.map(({ expected }) => expected))
const wrong = {
  'the input unchanged': cases.map(({ input }) => input),
  'the hex text alone': right.map(([t]) => t),
  'the pair swapped': right.map(([t, b]) => [b, t]),
  'upper-case hex': right.map(([t, b]) => [t.toUpperCase(), b]),
  'hex with a 0x prefix': right.map(([t, b]) => ['0x' + t, b]),
  'hex with spaces between bytes': right.map(([t, b], i) => [(t.match(/../g) ?? []).join(' '), b]),
  'base64 instead of hex': right.map(([, b], i) => [buf(i).toString('base64'), b]),
  'the text as the decoded bytes': right.map(([t]) => [t, Uint8Array.from(Buffer.from(t, 'latin1'))]),
  'decoded bytes one short': right.map(([t, b]) => [t, b.subarray(0, Math.max(0, b.length - 1))]),
  'decoded bytes reversed': right.map(([t, b]) => [t, Uint8Array.from(b).reverse()]),
  "another fixture's pair": right.map((_, i) => right[(i + 1) % right.length]),
  'a constant pair': right.map(() => ['00', Uint8Array.of(0)]),
}
for (const [name, outputs] of Object.entries(wrong)) assert.throws(() => verifyResults(outputs), undefined, `${name} must be refused`)
