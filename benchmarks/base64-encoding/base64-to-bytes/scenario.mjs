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
// Capped at 4 KB: with larger buffers the figure was bulk throughput alone.
for (let i = 0; i < 10; i++) sizes.push(1000 + i * 113)
for (let i = 0; i < 8; i++) sizes.push(2048 + i * 292)
const payloads = sizes.map((n, i) => bytes(n, i + 1))
// Make some payloads text-like or patterned, since not all real data is random.
payloads[0].fill(0); payloads[1].fill(255)
payloads[2] = Buffer.from('{"id":12345,"name":"Zoë","ok":true}'.padEnd(32, ' ').slice(0, 32), 'utf8')
export const cases = payloads.map((p) => ({ input: Buffer.from(p).toString('base64'), expected: Buffer.from(p).toString('hex') }))
const expectedBytes = cases.map(({ expected }) => Buffer.from(expected, 'hex'))
const check = (i, actual) => {
  assert.equal(actual.length, expectedBytes[i].length, `fixture ${i}: length`)
  for (let j = 0; j < actual.length; j++) if (actual[j] !== expectedBytes[i][j]) assert.fail(`fixture ${i}: byte ${j}`)
}
// Native runners send each output as a list of byte values.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) {
    assert.ok(Array.isArray(outputs[i]), `fixture ${i}: byte list required`)
    check(i, outputs[i])
  }
}
export const verify = (operation) => {
  for (const [i, { input }] of cases.entries()) {
    const out = operation(input)
    assert.ok(out instanceof Uint8Array, `fixture ${i}: Uint8Array (or Buffer) output required`)
    check(i, out)
  }
}
export const consume = (value) => value.length
