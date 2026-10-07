import { strict as assert } from 'node:assert'
// Four producers, always: the thread count is part of the task (task.json
// load.threads is the producers plus the consumer).
const PRODUCERS = 4
const MESSAGES = [250, 1000, 4000]
const CAPACITIES = [1, 16, 1024]
// Producer p sends the integers i * PRODUCERS + p for i = 0, 1, 2, ... so the
// consumer can tell from a message who sent it and which of theirs it is.
export const cases = MESSAGES.flatMap((messages) => CAPACITIES.map((capacity) => {
  const count = PRODUCERS * messages
  // The sum of 0 .. count - 1: every message exactly once.
  return { input: { producers: PRODUCERS, messages, capacity }, expected: { count, sum: (count * (count - 1)) / 2, ordered: true } }
}))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const output = outputs[i]
    assert.ok(output && typeof output === 'object', `fixture ${i}: an object is required`)
    assert.strictEqual(output.count, expected.count, `fixture ${i}: messages received`)
    assert.strictEqual(output.ordered, true, `fixture ${i}: each producer's messages must arrive in the order sent`)
    assert.strictEqual(output.sum, expected.sum, `fixture ${i}: sum of the messages`)
  }
}
// No JavaScript adapter exists for this task; these are here for one that
// passes messages between worker threads.
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (output) => output.count
