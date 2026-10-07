import { strict as assert } from 'node:assert'
// Entries are multiples of 1/4 with small magnitude, so every product and sum
// is exact in 64-bit floats and the result does not depend on summation order.
const sizes = [4, 4, 4, 6, 8, 12, 16, 24]
const entry = (i, j, s) => (((i * 7 + j * 13 + s * 5 + i * j) % 17) - 8) / 4
const matrix = (n, s) => Array.from({ length: n * n }, (_, k) => entry(Math.floor(k / n), k % n, s))
const reference = (n, a, b) => {
  const c = new Array(n * n).fill(0)
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let sum = 0; for (let k = 0; k < n; k++) sum += a[i * n + k] * b[k * n + j]; c[i * n + j] = sum }
  return c
}
export const cases = Array.from({ length: 48 }, (_, i) => {
  const n = sizes[i % sizes.length]
  const a = matrix(n, i), b = matrix(n, i + 3)
  return { input: { n, a, b }, expected: reference(n, a, b) }
})
// A library's own result type is read through its flat row-major data.
const flat = (r) => Array.isArray(r) ? r : Array.from(r.data ?? r.toArray())
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = flat(outputs[i])
    assert.equal(out.length, expected.length, `fixture ${i}: length`)
    for (let k = 0; k < expected.length; k++) assert.ok(Math.abs(out[k] - expected[k]) <= 1e-9, `fixture ${i}: element ${k}: ${out[k]} vs ${expected[k]}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.data.length
