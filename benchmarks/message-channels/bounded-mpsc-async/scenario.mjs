import { strict as assert } from 'node:assert'
// Four producers, always: they are the task's concurrency (task.json
// load.concurrency); everything runs on one thread (load.threads is 1).
const PRODUCERS = 4
const MESSAGES = [250, 1000, 4000]
// Every capacity is at least the number of producers, so a channel that gives
// each sender a slot of its own (futures-channel) can be given exactly the same
// capacity as every other: buffer = capacity - producers.
const CAPACITIES = [16, 64, 1024]
// Producer p sends the integers i * PRODUCERS + p for i = 0, 1, 2, ... so the
// consumer can tell from a message who sent it and which of theirs it is.
export const cases = MESSAGES.flatMap((messages) => CAPACITIES.map((capacity) => {
  const count = PRODUCERS * messages
  // The sum of 0 .. count - 1: every message exactly once.
  return { input: { producers: PRODUCERS, messages, capacity }, expected: { count, sum: (count * (count - 1)) / 2, ordered: true } }
}))
const verifyOne = (i, output) => {
  const { expected } = cases[i]
  assert.ok(output && typeof output === 'object', `fixture ${i}: an object is required`)
  assert.strictEqual(output.count, expected.count, `fixture ${i}: messages received`)
  assert.strictEqual(output.ordered, true, `fixture ${i}: each producer's messages must arrive in the order sent`)
  assert.strictEqual(output.sum, expected.sum, `fixture ${i}: sum of the messages`)
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
// The check must refuse a lost or duplicated message, a reordered producer,
// a missing field and a count known in advance with no sum behind it.
for (const [i, { expected }] of cases.entries()) {
  verifyOne(i, expected)
  for (const wrong of [
    { ...expected, count: expected.count - 1 },
    { ...expected, sum: expected.sum - 1 },
    { ...expected, sum: expected.sum + PRODUCERS },
    { ...expected, ordered: false },
    { count: expected.count, ordered: true },
    { ...expected, count: String(expected.count) },
    null,
  ]) assert.throws(() => verifyOne(i, wrong))
}
