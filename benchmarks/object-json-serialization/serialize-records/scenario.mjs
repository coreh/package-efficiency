import { strict as assert } from 'node:assert'
// An input is a list of 50 records. Each record has twelve fields; the
// serializer must emit ten of them (`password_hash` and `internal_note` are
// private) and, under `orders`, the list of nested items with three of their
// four fields (`cost` is private).
const names = ['Ada Lovelace', 'Tom "Tommy" Smith', 'Zoë Müller', '日本語 太郎', "O'Brien, Pat", 'Back\\slash', 'Line\nBreak', 'Emoji 😀 Fan', 'plain']
const roles = ['admin', 'editor', 'viewer', 'guest']
const bios = ['', 'Likes <b>tags</b> & ampersands', 'Tab\there', 'Quote " and apostrophe \'', 'ünïcödé — dash', 'A longer biography that goes on for a while, to give the string some weight in the output.']
const skus = ['A-100', 'B-220', 'C-3', 'D/4', 'E "5"']
const order = (n, k) => ({ sku: skus[(n + k) % skus.length], qty: 1 + ((n * 3 + k) % 9), price: ((n * 37 + k * 11) % 5000) / 100 + 0.25, cost: ((n + k) % 70) / 4 })
const record = (seed, i) => {
  const n = seed * 53 + i
  return {
    id: 1000 + n,
    name: names[n % names.length],
    email: `user${n}@example.com`,
    active: n % 3 !== 0,
    role: roles[n % roles.length],
    score: ((n * 7919) % 10000) / 100,
    visits: (n * 104729) % 100000,
    joined: `2025-${String(1 + (n % 12)).padStart(2, '0')}-${String(1 + (n % 28)).padStart(2, '0')}T${String(n % 24).padStart(2, '0')}:30:00Z`,
    bio: bios[n % bios.length],
    orders: Array.from({ length: n % 5 }, (_, k) => order(n, k)),
    password_hash: `$2b$12$${(n * 2654435761 % 4294967296).toString(36)}`,
    internal_note: `note ${n}`,
  }
}
export const cases = Array.from({ length: 6 }, (_, s) => ({ input: Array.from({ length: 50 }, (_, i) => record(s, i)) }))

const expectedRecord = ({ password_hash, internal_note, orders, ...rest }) => ({ ...rest, orders: orders.map(({ cost, ...o }) => o) })
const expected = cases.map(({ input }) => input.map(expectedRecord))

// The output is JSON text; the check reads it back and compares the structure
// (key order and white space are style).
export const verifyOne = (i, output) => {
  assert.equal(typeof output, 'string', `fixture ${i}: JSON text is required`)
  let got
  try { got = JSON.parse(output) } catch (e) { assert.fail(`fixture ${i}: not valid JSON: ${e.message}`) }
  assert.deepEqual(got, expected[i], `fixture ${i}: parsed JSON differs from the expected records`)
}
// The check must fail on output that did not do the job.
assert.throws(() => verifyOne(0, JSON.stringify(cases[0].input)), 'private fields must fail')
assert.throws(() => verifyOne(0, JSON.stringify(expected[0].map(({ orders, ...r }) => r))), 'missing nested list must fail')
assert.throws(() => verifyOne(0, JSON.stringify(expected[0].slice(1))), 'missing record must fail')
assert.throws(() => verifyOne(0, JSON.stringify(expected[0].map((r) => ({ ...r, name: r.name.trim() + ' ' })))), 'changed value must fail')
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
