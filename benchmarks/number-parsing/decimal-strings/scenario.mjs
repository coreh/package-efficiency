import { strict as assert } from 'node:assert'

// Each fixture is a batch of decimal number strings; one operation parses the
// whole batch and returns an array of numbers in order. Expected values come
// from the JavaScript engine's own correctly rounded string-to-double
// conversion, computed here once and never by the adapters.
let state = 12345
const rnd = (n) => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return (state >>> 8) % n }
const digits = (n) => { let s = String(1 + rnd(9)); while (s.length < n) s += rnd(10); return s }
const make = (kind) => {
  switch (kind) {
    case 0: return digits(1 + rnd(3))                                   // small integer
    case 1: return digits(4 + rnd(6))                                   // medium integer
    case 2: return digits(10 + rnd(6))                                  // large integer, up to 15 digits
    case 3: return '-' + digits(1 + rnd(12))                            // negative integer
    case 4: return `${digits(1 + rnd(3))}.${digits(1 + rnd(2))}`        // short decimal
    case 5: return `${digits(3 + rnd(3))}.${rnd(10)}${rnd(10)}`         // price-like
    case 6: return `${rnd(10)}.${digits(8 + rnd(6))}`                   // long fraction, up to 15 significant digits
    case 7: return `${digits(1)}.${digits(1 + rnd(6))}${['e', 'E'][rnd(2)]}${['', '+', '-'][rnd(3)]}${1 + rnd(30)}` // exponent form
    case 8: return `-0.${'0'.repeat(rnd(5))}${digits(1 + rnd(6))}`      // small negative
    default: return `${digits(1 + rnd(4))}.0`                           // whole number written as a float
  }
}
const sizes = [8, 16, 24, 32, 40]
export const cases = Array.from({ length: 48 }, (_, i) => {
  const input = Array.from({ length: sizes[i % sizes.length] }, (_, j) => make((i * 7 + j * 3 + rnd(10)) % 10))
  return { input, expected: input.map(Number) }
})
// Ordinary tricky values: binary-inexact decimals, extreme exponents, zero. Plain
// digit strings stay within 15 significant digits (see task.md); only the
// exponent forms carry more.
const hard = ['0.1', '0.3', '0.7', '3.14159265358979', '999999999999999', '2.2250738585072014e-308',
  '1.7976931348623157e308', '4.9e-324', '1e23', '8.5e-5', '-1.5e300', '100', '0', '-7', '0.000001', '123456.789e-3']
cases.push({ input: hard, expected: hard.map(Number) })

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    const actual = outputs[i]
    assert.ok(Array.isArray(actual), `fixture ${i}: array of numbers required`)
    assert.equal(actual.length, expected.length, `fixture ${i}: one number per string`)
    for (let j = 0; j < expected.length; j++) {
      assert.equal(typeof actual[j], 'number', `fixture ${i}[${j}] ${input[j]}: number required, got ${typeof actual[j]}`)
      assert.equal(actual[j], expected[j], `fixture ${i}[${j}] ${JSON.stringify(input[j])}`)
    }
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
