import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (a 32-bit LCG); no Math.random.
const rng = (seed) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296 }
// The largest fixture is the task's concurrency (task.json load.concurrency).
const JOBS = [100, 1000, 4000]
// A job turns its value v into v * 2 + 1. Nothing limits how many run at
// once, and every job yields once while it is counted as in flight, so every
// job is in flight at the busiest moment: the peak is the number of jobs.
export const cases = JOBS.map((jobs, j) => {
  const next = rng(29 + j * 13)
  const values = Array.from({ length: jobs }, () => Math.floor(next() * 100000))
  return { input: { values }, expected: { results: values.map((v) => v * 2 + 1), peak: jobs } }
})
const verifyOne = (i, output) => {
  const { expected } = cases[i]
  assert.ok(output && Array.isArray(output.results), `fixture ${i}: results must be an array`)
  assert.strictEqual(output.peak, expected.peak, `fixture ${i}: with no limit, all ${expected.peak} jobs are in flight at once`)
  assert.deepStrictEqual(output.results, expected.results, `fixture ${i}: results in input order`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
// Each operation is awaited before the next one starts.
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (output) => output.results.length + output.peak
// The check must refuse jobs run one after another (peak 1) or not all at
// once, results in completion order reversed or sorted, a result missing or
// counted twice, the raw values, results as strings, and null.
for (const [i, { input, expected }] of cases.entries()) {
  const { results, peak } = expected
  verifyOne(i, { results: [...results], peak })
  for (const wrong of [
    { results, peak: 1 },
    { results, peak: peak - 1 },
    { results: [...results].reverse(), peak },
    { results: [...results].sort((a, b) => a - b), peak },
    { results: results.slice(1), peak },
    { results: results.slice(0, -1), peak },
    { results: [...results, results[results.length - 1]], peak },
    { results: input.values, peak },
    { results: results.map(String), peak },
    { results: results.map((v) => v + 2), peak },
    null,
  ]) assert.throws(() => verifyOne(i, wrong))
}
