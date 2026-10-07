import { strict as assert } from 'node:assert'
// Independent reference: bitwise CRC-32 (reflected polynomial 0xEDB88320, init and final xor 0xFFFFFFFF).
const bytes = new TextEncoder()
const reference = (s) => {
  let crc = 0xffffffff
  for (const b of bytes.encode(s)) {
    crc ^= b
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
  }
  return (crc ^ 0xffffffff) >>> 0
}
// Known check values guard the reference itself.
assert.equal(reference(''), 0)
assert.equal(reference('123456789'), 0xcbf43926)
assert.equal(reference('The quick brown fox jumps over the lazy dog'), 0x414fa339)
const prose = 'Efficiency is measured as CPU time and memory for the same job. Päckages wörk with ünïcode, 日本語 and 😀 too. '
const json = (i) => JSON.stringify({ id: i, name: `User ${i}`, tags: ['alpha', 'βeta'], nested: { scores: [i, i + 1, i / 3], city: 'São Paulo' } })
const log = (i) => `2026-10-06T12:${String(i % 60).padStart(2, '0')}:00Z INFO request id=${i * 7919} path=/api/v1/items/${i} status=200 bytes=${i * 313}\n`
const inputs = []
// Short ASCII of every length up to 17 (tail handling of word-at-a-time and SIMD code).
for (let n = 1; n <= 17; n++) inputs.push('abcdefghijklmnopqrstuvwxyz'.slice(0, n))
inputs.push('', '123456789', '\u0000'.repeat(64), 'ÿ'.repeat(33))
// Packets, log lines and documents of varied length (tens of bytes to a few KB).
for (let i = 0; i < 10; i++) inputs.push(json(i).repeat(1 + i * 3))
for (let i = 0; i < 10; i++) inputs.push(log(i).repeat(1 + i * i))
for (let i = 0; i < 8; i++) inputs.push(prose.repeat(1 + i * i * 2).slice(0, 100 + i * 1000))
// Larger buffers with a deterministic byte-like spread, 8 KB and 16 KB.
for (const n of [8192, 16384]) inputs.push(Array.from({ length: n }, (_, j) => String.fromCharCode(32 + ((j * 31 + (j >> 3) * 7) % 95))).join(''))
export const cases = inputs.map((input) => ({ input, expected: reference(input) }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'number', `fixture ${i}: number output required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value & 0xffff
