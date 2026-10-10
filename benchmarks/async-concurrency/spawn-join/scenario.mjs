import { strict as assert } from 'node:assert'
// Every fixture spawns the same number of tasks: they are the task's
// concurrency (task.json load.concurrency); all run on one thread.
const TASKS = 10000
// Task i returns (i * multiplier + offset) % MODULUS. The largest product,
// 9,999 * 65,520 + 65,520, stays below 2^31, so the value is exact as a
// signed 32-bit integer, a double, a Python int or a Go int alike.
const MODULUS = 65521
const PARAMETERS = [
  { multiplier: 40503, offset: 11 },
  { multiplier: 12345, offset: 54321 },
  { multiplier: 65519, offset: 3 },
]
const value = (i, { multiplier, offset }) => (i * multiplier + offset) % MODULUS
const sumOf = (from, to, parameters) => {
  let sum = 0
  for (let i = from; i < to; i++) sum += value(i, parameters)
  return sum
}
export const cases = PARAMETERS.map((parameters) => ({
  input: { tasks: TASKS, modulus: MODULUS, ...parameters },
  expected: sumOf(0, TASKS, parameters),
}))
const verifyOne = (i, output) => {
  assert.strictEqual(output, cases[i].expected, `fixture ${i}: the sum of the ${TASKS} tasks' values`)
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
export const consume = (output) => output
// The check must refuse a task left out (the first or the last), a task joined
// twice, indices counted from one, another fixture's sum, the task count, and
// the right number as a string.
assert.equal(new Set(cases.map(({ expected }) => expected)).size, cases.length, 'every fixture has its own sum')
for (const [i, { input, expected }] of cases.entries()) {
  verifyOne(i, expected)
  for (const wrong of [
    sumOf(1, TASKS, input),
    sumOf(0, TASKS - 1, input),
    expected + value(TASKS - 1, input),
    sumOf(1, TASKS + 1, input),
    cases[(i + 1) % cases.length].expected,
    TASKS,
    String(expected),
    null,
  ]) assert.throws(() => verifyOne(i, wrong))
}
