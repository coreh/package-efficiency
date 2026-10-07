import { strict as assert } from 'node:assert'
// The input is a call index and is ignored: an ID generator takes no input.
export const cases = Array.from({ length: 64 }, (_, i) => ({ input: i }))
const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
// Rust submits its native outputs to this same verifier before warm-up.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, out] of outputs.entries()) {
    assert.equal(typeof out, 'string', `fixture ${i}: string output required`)
    assert.match(out, V4, `fixture ${i}: not a UUID v4`)
  }
  assert.equal(new Set(outputs.map((s) => s.toLowerCase())).size, outputs.length, 'IDs must be unique')
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
