import { strict as assert } from 'node:assert'
// Input: { items, ops }. items are integers. The operation creates an immutable list holding the items in ONE step
// (the library's from-array constructor), then applies ops in order, each on the list the previous
// one produced. Every op is [kind, index, value]:
//   ["set", i, v]     replace the element at i with v
//   ["insert", i, v]  insert v so that it ends up at index i (i may equal the length)
//   ["remove", i, 0]  remove the element at i
//   ["get", i, 0]     read the element at i (the list is unchanged)
// A correct result is [finalList, gets]: the elements of the last version in order, and the values
// read by the "get" ops in order. Indices are always valid at the moment the op runs.
let seed = 2024
const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296
const int = (n) => Math.floor(next() * n)
const apply = (items, ops) => {
  let list = [...items]
  const gets = []
  for (const [kind, i, v] of ops) {
    if (kind === 'set') list = list.map((x, j) => (j === i ? v : x))
    else if (kind === 'insert') list = [...list.slice(0, i), v, ...list.slice(i)]
    else if (kind === 'remove') list = [...list.slice(0, i), ...list.slice(i + 1)]
    else gets.push(list[i])
  }
  return [list, gets]
}
const build = (n, count, weights) => {
  const items = Array.from({ length: n }, () => int(1000) - (next() < 0.1 ? 500 : 0))
  let len = n
  const ops = []
  while (ops.length < count) {
    const r = next() * weights.reduce((a, b) => a + b, 0)
    const kind = r < weights[0] ? 'get' : r < weights[0] + weights[1] ? 'set' : r < weights[0] + weights[1] + weights[2] ? 'insert' : 'remove'
    if ((kind === 'get' || kind === 'set' || kind === 'remove') && len === 0) continue
    const v = next() < 0.05 ? 0 : int(100000)
    if (kind === 'insert') { ops.push([kind, int(len + 1), v]); len++ } else if (kind === 'remove') { ops.push([kind, int(len), 0]); len-- } else ops.push([kind, int(len), kind === 'get' ? 0 : v])
  }
  return { items, ops }
}
const mixes = [[4, 3, 2, 1], [1, 6, 2, 1], [2, 1, 4, 3], [6, 1, 1, 1]]
export const cases = Array.from({ length: 40 }, (_, i) => {
  const input = build(40 + (i * 29) % 190, 300 + (i % 5) * 50, mixes[i % mixes.length])
  return { input, expected: apply(input.items, input.ops) }
})
// hand-made edge cases: empty start, removing down to empty, boundary indices
const edge = (input) => ({ input, expected: apply(input.items, input.ops) })
cases[38] = edge({ items: [], ops: [['insert', 0, 7], ['insert', 1, 8], ['insert', 0, 9], ['get', 0, 0], ['get', 2, 0], ['set', 1, 0], ['get', 1, 0], ['remove', 0, 0], ['remove', 1, 0], ['remove', 0, 0], ['insert', 0, 5], ['get', 0, 0]] })
cases[39] = edge({ items: [1, 2, 3], ops: [['insert', 3, 4], ['set', 0, -1], ['set', 3, 0], ['remove', 3, 0], ['get', 0, 0], ['get', 2, 0], ['remove', 0, 0], ['insert', 0, 0], ['get', 0, 0], ['get', 1, 0]] })
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepEqual(JSON.parse(JSON.stringify(outputs[i])), expected, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result[0].length + result[1].length
