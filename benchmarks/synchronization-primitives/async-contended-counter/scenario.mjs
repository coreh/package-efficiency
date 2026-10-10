import { strict as assert } from 'node:assert'
// Eight tasks, always: they are the task's concurrency (task.json
// load.concurrency); everything runs on one thread (load.threads is 1).
const TASKS = 8
const TURNS = [500, 1000, 2000]
// Each task takes TURNS tickets from one shared counter under one async lock,
// yielding once between reading the counter and writing it back. The tickets
// handed out are 0 .. count - 1, each exactly once, so their sum is known. A
// lock that does not exclude lets the other tasks read the same value during
// the yield: updates are lost and tickets handed out twice.
export const cases = TURNS.map((turns) => {
  const count = TASKS * turns
  return { input: { tasks: TASKS, turns }, expected: { count, sum: (count * (count - 1)) / 2 } }
})
const verifyOne = (i, output) => {
  const { expected } = cases[i]
  assert.ok(output && typeof output === 'object', `fixture ${i}: an object is required`)
  assert.strictEqual(output.count, expected.count, `fixture ${i}: final value of the counter`)
  assert.strictEqual(output.sum, expected.sum, `fixture ${i}: sum of the tickets taken`)
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
export const consume = (output) => output.count
// The check must refuse what a missing lock gives (every task reads the same
// value during its yield, so the counter ends at `turns` and each ticket is
// handed out eight times), one lost update, one duplicated ticket, a count
// known in advance with no sum behind it, and another fixture's result.
for (const [i, { input, expected }] of cases.entries()) {
  verifyOne(i, expected)
  const unlocked = { count: input.turns, sum: TASKS * (input.turns * (input.turns - 1)) / 2 }
  for (const wrong of [
    unlocked,
    { ...expected, count: expected.count - 1 },
    { ...expected, sum: expected.sum - 1 },
    { ...expected, sum: expected.sum - (expected.count - 1) },
    { count: expected.count },
    { ...expected, count: String(expected.count) },
    cases[(i + 1) % cases.length].expected,
    null,
  ]) assert.throws(() => verifyOne(i, wrong))
}
