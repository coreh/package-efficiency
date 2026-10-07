import { strict as assert } from 'node:assert'
// Each group builds two independent but equal values; variants then change one thing.
const make = (i) => ({
  id: i,
  created: new Date(Date.UTC(2024, i % 12, 1 + (i % 28), i % 24)),
  pattern: new RegExp(`^item-${i}$`, 'gi'),
  labels: new Set(['a', 'b', `c${i}`, i]),
  index: new Map([['x', { n: i, ok: true }], ['y', { n: i + 1, ok: false }], [i, [1, 2, 3]]]),
  bytes: new Uint8Array([i, i + 1, 2, 3, 4, 5, 6, 7]),
  floats: new Float64Array([i / 7, 2.5, 1.5]),
  ratio: i % 5 === 0 ? NaN : i / 3,
  list: [new Date(0), new Map([[1, new Set([1, 2])]])],
})
const mutate = [
  (v) => v,
  (v) => { v.created = new Date(v.created.getTime() + 1) },
  (v) => { v.pattern = new RegExp(v.pattern.source, 'g') },
  (v) => { v.labels.add('extra') },
  (v) => { v.index.set('x', { n: -1, ok: true }) },
  (v) => { v.bytes[7] = 99 },
  (v) => { v.floats[0] += 1 },
  (v) => { v.list[1] = new Map([[1, new Set([1, 3])]]) },
]
export const cases = []
for (let i = 0; i < 9; i++) {
  mutate.forEach((m, k) => {
    if (i === 8 && k > 0) return
    const a = make(i + 1), b = make(i + 1)
    m(b)
    cases.push({ input: [a, b], expected: k === 0 })
  })
}
cases.push(
  { input: [new Map([[1, 2], [3, 4]]), new Map([[3, 4], [1, 2]])], expected: true },
  { input: [new Set([1, 2, 3]), new Set([3, 2, 1])], expected: true },
  { input: [new Set([1, 2]), new Set([1, 2, 3])], expected: false },
  { input: [new Map([[1, 2]]), new Map([[1, 3]])], expected: false },
  { input: [new Map(), new Set()], expected: false },
  { input: [new Date(5), new Date(5)], expected: true },
  { input: [new Date(5), new Date(6)], expected: false },
  { input: [NaN, NaN], expected: true },
)
export const verifyResults = (outputs) => {
  assert.equal(outputs.length, cases.length)
  outputs.forEach((o, i) => assert.equal(o, cases[i].expected, `case ${i}`))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => Number(value)
