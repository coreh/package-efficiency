import { strict as assert } from 'node:assert'
// Each fixture is a plain order, as parsed from JSON:
//   Order    { id: int, ref: str, total: float, paid: bool, note: str | null, tags: [str], customer: Customer, lines: [Line] }
//   Customer { name: str, age: int, score: float, active: bool, nickname: str | null }
//   Line     { sku: str, qty: int, price: float, gift: bool, comment: str | null }
// Every field is present in every fixture (an absent optional is an explicit null),
// and every float has a fraction (.25, .5 or .75), so no spelling of a number can differ.
const words = ['amber', 'birch', 'cedar', 'delta', 'ember', 'fjord', 'grove', 'haven', 'iris', 'jade']
const makeLine = (i, k) => ({
  sku: `SKU-${words[(i + k) % words.length]}-${(i * 31 + k * 17) % 1000}`,
  qty: 1 + ((i + k * 3) % 12),
  price: ((i * 7 + k * 11) % 400) + 0.25 * (1 + ((i + k) % 3)),
  gift: (i + k) % 5 === 0,
  comment: (i + k) % 3 === 0 ? `note ${k} for ${words[(i * 3 + k) % words.length]}` : null,
})
const makeOrder = (i) => ({
  id: 1000 + i * 13,
  ref: `ORD-${String(i).padStart(5, '0')}-${words[i % words.length]}`,
  total: i * 19 + 0.75,
  paid: i % 3 !== 0,
  note: i % 4 === 1 ? `deliver to the ${words[(i + 4) % words.length]} gate` : null,
  tags: Array.from({ length: i % 5 }, (_, k) => `tag-${words[(i + k) % words.length]}`),
  customer: {
    name: `${words[i % words.length]} ${words[(i * 3 + 1) % words.length]}`,
    age: 18 + ((i * 7) % 60),
    score: ((i * 13) % 100) + 0.5,
    active: i % 2 === 0,
    nickname: i % 3 === 2 ? `nick-${i}` : null,
  },
  lines: Array.from({ length: 1 + ((i * 5) % 8) }, (_, k) => makeLine(i, k)),
})
export const cases = Array.from({ length: 32 }, (_, i) => ({ input: makeOrder(i) }))

// The common result of the operation, in every language, is a pair
//   [record, plain]   the record objects the library built, and the plain data it dumped from them
// A Python or Ruby adapter's describe, and a Rust adapter's describe, turn the pair into
//   { classes: [root, customer, first line], customer: name read from the object,
//     lines: number of lines read from the object, first: sku of the first line read from the object, plain }
// JavaScript is described here, from the live objects. The class names are fixed: Order, Customer, Line.
const nameOf = (o) => (o && o.constructor && o.constructor.name) || typeof o
const describeJs = ([record, plain]) => ({
  classes: [nameOf(record), nameOf(record.customer), nameOf(record.lines[0])],
  customer: record.customer.name,
  lines: record.lines.length,
  first: record.lines[0].sku,
  plain,
})
// The plain data is compared as data: nothing may be added, dropped or retyped.
// Key order is not compared.
export const verifyOne = (i, output) => {
  const { input } = cases[i]
  if (typeof output === 'string') output = JSON.parse(output)
  if (Array.isArray(output)) output = describeJs(output)
  assert.ok(output && typeof output === 'object', `fixture ${i}: a result is required`)
  assert.deepEqual(output.classes, ['Order', 'Customer', 'Line'], `fixture ${i}: the objects must be instances of the declared classes`)
  assert.equal(output.customer, input.customer.name, `fixture ${i}: customer name read from the object`)
  assert.equal(output.lines, input.lines.length, `fixture ${i}: line count read from the object`)
  assert.equal(output.first, input.lines[0].sku, `fixture ${i}: first sku read from the object`)
  assert.deepEqual(output.plain, input, `fixture ${i}: the round trip must equal the input`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// Proof that the check can fail: the input returned as it is has no classes.
assert.throws(() => verifyOne(0, [cases[0].input, cases[0].input]), /declared classes/)
