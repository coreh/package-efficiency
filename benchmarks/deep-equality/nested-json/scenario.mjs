import { strict as assert } from 'node:assert'
const record = (i) => ({ id: i, name: `User ${i}`, active: i % 2 === 0, tags: ['alpha', 'βeta', null], nested: { scores: [i, i + 1, i / 3], address: { city: 'São Paulo', zip: `${i}` } } })
export const cases = Array.from({ length: 64 }, (_, i) => {
  const a = record(i), b = JSON.parse(JSON.stringify(a))
  if (i % 4 === 1) b.id++
  if (i % 4 === 2) b.nested.scores[2]++
  if (i % 4 === 3) delete b.nested.address.zip
  return { input: [a, b], expected: i % 4 === 0 }
})
cases.push({ input: [null, null], expected: true }, { input: [[], {}], expected: false }, { input: [{ a: 1, b: 2 }, { b: 2, a: 1 }], expected: true })
export const verify = (operation) => { for (const { input, expected } of cases) assert.equal(operation(input), expected) }
export const consume = (value) => Number(value)
