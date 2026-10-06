import { strict as assert } from 'node:assert'
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k])])) : value
export const cases = Array.from({ length: 64 }, (_, i) => {
  const input = { zebra: i, title: `Record ${i}: "quoted" \n café`, active: i % 2 === 0, items: [{ z: null, b: i / 7, a: [true, false, 'x'] }], alpha: { z: i, a: 'first' } }
  return { input, expected: JSON.stringify(canonical(input)) }
})
cases.push({ input: null, expected: 'null' }, { input: [], expected: '[]' }, { input: {}, expected: '{}' })
export const verify = (operation) => { for (const { input, expected } of cases) assert.equal(operation(input), expected) }
export const consume = (value) => value.length
