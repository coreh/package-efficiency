import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (a 32-bit LCG); no Math.random.
const rng = (seed) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296 }
const CALLS = 40
const ATTEMPTS = [3, 5, 8]
// A call is a function that fails `failures` times and then returns
// value * 2 + 1. Under a cap of `attempts` attempts it succeeds when
// failures < attempts and gives up, with the attempts all used, otherwise.
// Failure counts run from 0 to attempts + 1 so that every case occurs.
const expectedFor = (attempts, { value, failures }) =>
  failures < attempts ? { attempts: failures + 1, value: value * 2 + 1 } : { attempts, value: null }
export const cases = ATTEMPTS.map((attempts, a) => {
  const next = rng(31 + a * 5)
  const items = Array.from({ length: CALLS }, (_, i) => ({
    value: Math.floor(next() * 100000),
    failures: i < attempts + 2 ? i : Math.floor(next() * (attempts + 2)),
  }))
  return { input: { items, attempts }, expected: items.map((item) => expectedFor(attempts, item)) }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    const output = outputs[i]
    assert.ok(Array.isArray(output), `fixture ${i}: the output must be a list`)
    assert.equal(output.length, expected.length, `fixture ${i}: one result per call`)
    for (const [j, want] of expected.entries()) {
      const got = output[j]
      assert.ok(got && typeof got === 'object', `fixture ${i} call ${j}: a result is required`)
      assert.strictEqual(got.attempts, want.attempts, `fixture ${i} call ${j} (${input.items[j].failures} failures, ${input.attempts} attempts): attempts used`)
      assert.strictEqual(got.value, want.value, `fixture ${i} call ${j} (${input.items[j].failures} failures, ${input.attempts} attempts): value`)
    }
  }
}
// Each operation is awaited before the next one starts.
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (output) => output.length
