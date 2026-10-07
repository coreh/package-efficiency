import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
const reference = (s) => Buffer.from(s, 'utf8').toString('base64')
const prose = 'Efficiency is measured as CPU time and memory for the same job. Päckages wörk with ünïcode, 日本語 and 😀 too. '
const json = (i) => JSON.stringify({ id: i, name: `User ${i}`, tags: ['alpha', 'βeta'], nested: { scores: [i, i + 1, i / 3], city: 'São Paulo' } })
const hex = '0123456789abcdef'
const inputs = []
// 32-byte values, as in tokens and digests written as text.
for (let i = 0; i < 16; i++) inputs.push(Array.from({ length: 32 }, (_, j) => hex[(i * 7 + j * 5 + (j >> 2)) % 16]).join(''))
// Every length modulo 3, short.
for (let n = 1; n <= 9; n++) inputs.push('abcdefghi'.slice(0, n))
// Unicode and JSON documents of varied length.
for (let i = 0; i < 8; i++) inputs.push(json(i).repeat(1 + i * 3))
for (let i = 0; i < 6; i++) inputs.push(prose.repeat(1 + i * i * 2).slice(0, 100 + i * 700))
inputs.push('\u0000\u0001\u007f\u0080߿ࠀ￿'.repeat(5), '\u{1F600}\u{10FFFF}'.repeat(10), '', '\n\r\n\t ' )
export const cases = inputs.map((input) => ({ input, expected: reference(input) }))
// Rust submits its native outputs to this same verifier before warm-up.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
