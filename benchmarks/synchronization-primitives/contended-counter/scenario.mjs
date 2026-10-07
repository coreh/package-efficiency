import { strict as assert } from 'node:assert'
// Four threads, always: the thread count is part of the task (task.json
// load.threads).
const THREADS = 4
const TURNS = [2000, 10000, 50000]
// Each thread takes TURNS tickets from one shared counter under one lock. The
// tickets handed out are 0 .. count - 1, each exactly once, so their sum is
// known; a lock that does not exclude loses updates and hands out duplicates.
export const cases = TURNS.map((turns) => {
  const count = THREADS * turns
  return { input: { threads: THREADS, turns }, expected: { count, sum: (count * (count - 1)) / 2 } }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const output = outputs[i]
    assert.ok(output && typeof output === 'object', `fixture ${i}: an object is required`)
    assert.strictEqual(output.count, expected.count, `fixture ${i}: final value of the counter`)
    assert.strictEqual(output.sum, expected.sum, `fixture ${i}: sum of the tickets taken`)
  }
}
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (output) => output.count
