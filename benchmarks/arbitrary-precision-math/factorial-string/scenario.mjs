import { strict as assert } from 'node:assert'
const factorial = (n) => { let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return r.toString() }
const ns = [0, 1, 2, 3, 5, 10, 12, 13, 20, 21, 25, 30, 40, 50, 64, 69, 75, 99, 100, 120, 150, 170, 171, 200, 250, 300, 365, 400, 500, 512, 600, 700, 750, 800, 900, 950, 999, 1000, 1000, 1000]
export const cases = ns.map((n) => ({ input: n, expected: factorial(n) }))
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
