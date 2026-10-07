import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (a 32-bit LCG); no Math.random.
const rng = (seed) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296 }
const JOBS = [100, 400, 1600]
const LIMITS = [1, 4, 10, 32]
// A job turns its value v into v * 2 + 1. With more jobs than the limit, and
// every job yielding once while it is counted as in flight, a correct limiter
// has exactly `limit` jobs in flight at its busiest.
export const cases = JOBS.flatMap((jobs, j) => LIMITS.map((limit, l) => {
  const next = rng(11 + j * 7 + l)
  const values = Array.from({ length: jobs }, () => Math.floor(next() * 100000))
  return { input: { values, limit }, expected: { results: values.map((v) => v * 2 + 1), peak: limit } }
}))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    const output = outputs[i]
    assert.ok(output && Array.isArray(output.results), `fixture ${i}: results must be an array`)
    assert.strictEqual(output.peak, expected.peak, `fixture ${i}: with a limit of ${input.limit}, the most jobs in flight at once`)
    assert.deepStrictEqual(output.results, expected.results, `fixture ${i}: results in input order`)
  }
}
// Each operation is awaited before the next one starts.
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (output) => output.results.length + output.peak
