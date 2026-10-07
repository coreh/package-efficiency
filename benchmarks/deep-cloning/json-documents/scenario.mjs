import { strict as assert } from 'node:assert'

const words = ['alpha', 'beta', 'gamma', 'café', '日本語', 'São Paulo', 'naïve 😀', 'line\nbreak', 'say "hi"', '']
const user = (i) => ({
  id: i, name: `User ${i}`, email: `user${i}@example.com`, active: i % 2 === 0, score: i / 7, manager: i % 5 === 0 ? null : i - 1,
  tags: words.slice(i % 4, i % 4 + 3),
  address: { street: `${i} Main St`, city: words[i % words.length], geo: [-23.5 + i / 100, -46.6 - i / 100] },
  prefs: { theme: i % 3 ? 'dark' : 'light', notifications: { email: true, sms: i % 4 === 0 } },
})
const order = (i, n) => ({
  orderId: `ORD-${i}`, customer: user(i), paid: i % 3 !== 0, notes: i % 2 ? null : words[i % words.length],
  lines: Array.from({ length: n }, (_, j) => ({ sku: `SKU-${i}-${j}`, qty: 1 + (i + j) % 5, price: 9.99 + j * 1.5, discounts: j % 3 === 0 ? [0.1, 0.25] : [] })),
})
const config = (i, width) => ({
  name: `svc-${i}`, version: `${1 + i % 3}.${i % 10}.0`,
  sections: Object.fromEntries(Array.from({ length: width }, (_, j) => [`section_${j}`, {
    enabled: (i + j) % 2 === 0, limits: [j, j * 10, j * 100], endpoints: Array.from({ length: 1 + j % 3 }, (_, k) => ({ host: `h${k}.example.com`, port: 8000 + k, tls: k % 2 === 0 })),
  }])),
})
const chain = (depth) => { let v = { leaf: true, value: 'end' }; for (let d = 0; d < depth; d++) v = d % 2 ? { level: d, child: v } : [d, v, null]; return v }
const matrix = (r, c) => Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => (i * c + j) / 4))
const flat = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`key_${i}`, i % 3 === 0 ? `value ${i}` : i % 3 === 1 ? i : i % 2 === 0]))
const strings = (n) => Array.from({ length: n }, (_, i) => `${words[i % words.length]} ${i}`)

const docs = []
for (let i = 0; i < 12; i++) docs.push(user(i))
for (let i = 0; i < 10; i++) docs.push(order(i, 1 + i * 3))
for (let i = 0; i < 6; i++) docs.push(config(i, 2 + i * 4))
for (const [r, c] of [[2, 2], [8, 8], [20, 20], [40, 50]]) docs.push(matrix(r, c))
for (const d of [3, 10, 30, 100]) docs.push(chain(d))
for (const n of [5, 50, 400]) docs.push(flat(n))
for (const n of [3, 40, 300]) docs.push(strings(n))
docs.push(42, 'text', [], {}, [[], {}, [[]], { a: {} }])
// Fresh trees: the expected side is built from the same constructors as the inputs
// but separately, so equality never rests on object identity.
const copyOf = (v) => JSON.parse(JSON.stringify(v))
export const cases = docs.map((input) => ({ input, expected: copyOf(input) }))

const isObj = (v) => v !== null && typeof v === 'object'
const noSharing = (a, b, path, seen) => {
  if (!isObj(a)) return
  assert.notStrictEqual(a, b, `${path}: same object as input`)
  assert.ok(!seen.has(a), `${path}: output object appears twice`)
  seen.add(a)
  for (const k of Object.keys(b)) noSharing(a[k], b[k], `${path}.${k}`, seen)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepStrictEqual(outputs[i], expected, `fixture ${i}`)
}
export const verify = (operation) => {
  const outputs = cases.map(({ input }) => operation(input))
  verifyResults(outputs)
  for (const [i, { input }] of cases.entries()) {
    const out = outputs[i]
    noSharing(out, input, `fixture ${i}`, new Set())
    // Mutating the copy must not touch the input.
    if (Array.isArray(out)) { out.push('x'); assert.notEqual(input.length, out.length, `fixture ${i}: shared array`) }
    else if (isObj(out)) { out.__probe = 1; assert.ok(!('__probe' in input), `fixture ${i}: shared object`) }
  }
  // Inputs must be unchanged by cloning.
  for (const { input, expected } of cases) assert.deepStrictEqual(input, expected, 'input was modified')
}
// An array's length, and one for anything else (an object has no length).
export const consume = (result) => (Array.isArray(result) ? result.length : 1)
