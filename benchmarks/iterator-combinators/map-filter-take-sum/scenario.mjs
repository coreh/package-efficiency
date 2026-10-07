import { strict as assert } from 'node:assert'
const mapFn = (x) => x * 3 + 1
const keep = (x) => x % 5 !== 0
const reference = (data, limit) => {
  let sum = 0, taken = 0, survivors = 0
  for (const x of data) { const y = mapFn(x); if (keep(y)) { survivors++; if (taken < limit) { sum += y; taken++ } } }
  return { sum, survivors }
}
let seed = 12345
const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648)
const sizes = [50, 120, 300, 800, 2000, 5000]
export const cases = Array.from({ length: 48 }, (_, i) => {
  const n = sizes[i % sizes.length] + (i % 7) * 11
  const data = Array.from({ length: n }, () => next() % 100000)
  const { survivors } = reference(data, 0)
  const limit = [Math.floor(survivors / 4), survivors, survivors + 50, Math.floor(survivors / 2), 7, Math.floor(survivors * 0.9)][i % 6]
  return { input: [data, limit], expected: reference(data, limit).sum }
})
cases.push({ input: [[1, 2, 3], 0], expected: 0 })
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'number', `fixture ${i}: number output required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value
