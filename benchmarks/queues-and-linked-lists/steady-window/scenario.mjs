import { strict as assert } from 'node:assert'
// Deterministic fixtures: [window, items]. The expected output of a FIFO queue
// is the items in their original order, followed by the number of items the
// queue held when the last item had been pushed (read from the queue before the
// drain). Returning the input unchanged therefore fails.
let seed = 12345
const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0)
const lengths = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 100, 144, 200, 233, 300, 377, 450, 500, 610, 700, 800, 987, 1000, 1200]
const windows = [1, 2, 3, 4, 8, 16, 32, 50, 64, 100, 128, 256]
export const cases = Array.from({ length: 40 }, (_, i) => {
  const n = i < lengths.length ? lengths[i] : 50 + (i * 37) % 900
  const window = i % 7 === 0 ? n + 5 : windows[i % windows.length]
  const items = Array.from({ length: n }, (_, k) => {
    const r = next()
    switch (i % 4) {
      case 0: return k
      case 1: return r % 10
      case 2: return (r % 2000001) - 1000000
      default: return r % 2147483647
    }
  })
  // Counted here without a queue: one item is released per push once more
  // than `window` are held.
  let held = 0
  for (let k = 0; k < n; k++) if (++held > window) held--
  return { input: [window, items], expected: [...items, held] }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.ok(Array.isArray(outputs[i]), `fixture ${i}: list output required`)
    assert.deepEqual(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
