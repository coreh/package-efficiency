import { strict as assert } from 'node:assert'
// Deterministic fixtures: lists of instructions x (op = x & 3). The expected
// output is computed here with a plain array.
let seed = 424242
const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0)
const lengths = [0, 1, 2, 4, 7, 12, 20, 33, 50, 80, 120, 200, 300, 450, 700, 1000, 1500]
// op weights for [push back, push front, pop front, pop back]
const mixes = [
  [4, 4, 1, 1],
  [3, 3, 3, 3],
  [2, 2, 4, 4],
  [1, 6, 2, 1],
  [6, 1, 1, 2],
]
export const cases = Array.from({ length: 36 }, (_, i) => {
  const n = i < lengths.length ? lengths[i] : 30 + (i * 53) % 900
  const mix = mixes[i % mixes.length]
  const total = mix[0] + mix[1] + mix[2] + mix[3]
  const input = Array.from({ length: n }, () => {
    let r = next() % total
    let op = 0
    while (r >= mix[op]) { r -= mix[op]; op++ }
    return (next() % 100000000) * 4 + op
  })
  const dq = []
  const out = []
  for (const x of input) {
    const op = x & 3
    if (op === 0) dq.push(x)
    else if (op === 1) dq.unshift(x)
    else if (dq.length > 0) out.push(op === 2 ? dq.shift() : dq.pop())
  }
  out.push(-1)
  for (const x of dq) out.push(x)
  return { input, expected: out }
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
