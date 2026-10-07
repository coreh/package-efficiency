import { strict as assert } from 'node:assert'
const SIZE = 10
// [callers, cycles per caller]; always more callers than resources, so the
// pool is exhausted and callers have to wait.
const SHAPES = [[12, 100], [32, 50], [32, 150], [64, 75]]
// The value a caller adds to the resource it holds in a cycle.
const touch = (caller, cycle) => ((caller * 31 + cycle) % 97) + 1
const checksum = (callers, cycles) => {
  let sum = 0
  for (let c = 0; c < callers; c++) for (let j = 0; j < cycles; j++) sum += touch(c, j)
  return sum
}
export const cases = SHAPES.map(([callers, cycles]) => ({
  input: { size: SIZE, callers, cycles },
  expected: { cycles: callers * cycles, checksum: checksum(callers, cycles), peak: SIZE, drained: SIZE }
}))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const o = outputs[i]
    assert.ok(o && typeof o === 'object', `fixture ${i}: output must be an object`)
    // cycles and checksum are read from the resources themselves, after the callers are done.
    assert.strictEqual(o.cycles, expected.cycles, `fixture ${i}: cycles recorded by the resources`)
    assert.strictEqual(o.checksum, expected.checksum, `fixture ${i}: sum of what the callers touched`)
    // never more than the pool size in use, and all of the pool in use at the busiest
    assert.strictEqual(o.peak, expected.peak, `fixture ${i}: most resources in use at once`)
    // after the callers, all 10 resources can be checked out together: none was lost
    assert.strictEqual(o.drained, expected.drained, `fixture ${i}: resources back in the pool`)
  }
}
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (output) => output.cycles + output.peak
