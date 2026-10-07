import { strict as assert } from 'node:assert'
// Each fixture is a seed and a number of short vectors to build. The integers
// come from a small generator that every adapter repeats, so no time goes to
// reading input: the work is creating vectors, pushing and reading back.
const step = (x) => (Math.imul(x, 1664525) + 1013904223) >>> 0
const totals = ({ seed, count }) => {
  let x = seed >>> 0, pushed = 0, sum = 0
  for (let n = 0; n < count; n++) {
    x = step(x)
    const length = 1 + (x >>> 29)
    for (let k = 0; k < length; k++) { x = step(x); pushed++; sum += (x >>> 8) - (1 << 23) }
  }
  return [pushed, sum]
}
export const cases = Array.from({ length: 48 }, (_, i) => {
  const input = { seed: (i + 1) * 2654435761 >>> 0, count: 64 + (i % 8) * 64 }
  return { input, expected: totals(input) }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepStrictEqual(outputs[i], expected, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value[0]
