import { strict as assert } from 'node:assert'
// The input is a call index and is ignored: an ID generator takes no input.
export const cases = Array.from({ length: 64 }, (_, i) => ({ input: i }))
const NANO = /^[A-Za-z0-9_-]{21}$/
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, out] of outputs.entries()) {
    assert.equal(typeof out, 'string', `fixture ${i}: string output required`)
    assert.match(out, NANO, `fixture ${i}: not a 21-character URL-safe ID`)
  }
  assert.equal(new Set(outputs).size, outputs.length, 'IDs must be unique')
  assert.ok(new Set(outputs.join('')).size >= 40, 'IDs must use a varied alphabet')
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
