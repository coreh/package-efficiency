import { strict as assert } from 'node:assert'
const cities = ['São Paulo', 'Zürich', '東京', 'Reykjavík', 'Austin']
const valid = (i) => {
  const d = {
    id: 1 + i * 7,
    name: `User ${i} ${cities[i % 5]}`,
    email: `user${i}@example.com`,
    role: ['admin', 'editor', 'viewer'][i % 3],
    active: i % 2 === 0,
    tags: Array.from({ length: i % 5 }, (_, j) => `tag-${i}-${j}`),
    scores: Array.from({ length: 1 + i % 6 }, (_, j) => i / 4 + j * 1.5 - 3),
    address: { city: cities[(i + 2) % 5], zip: String(10000 + i * 37) },
  }
  if (i % 4 === 0) d.nickname = `nick${i}`
  if (i % 2 === 1) d.address.geo = { lat: ((i * 13) % 180) - 90, lng: ((i * 29) % 360) - 180 }
  return d
}
const breakers = [
  (d) => { d.id = String(d.id) },
  (d) => { d.id = 0 },
  (d) => { d.id = 1.5 },
  (d) => { d.name = '' },
  (d) => { delete d.email },
  (d) => { d.role = 'owner' },
  (d) => { d.active = 'yes' },
  (d) => { d.tags = [...d.tags, 42] },
  (d) => { d.tags = 'a,b' },
  (d) => { d.scores = [...d.scores, '1.5'] },
  (d) => { d.address = null },
  (d) => { delete d.address.zip },
  (d) => { d.address.city = '' },
  (d) => { d.address.geo = { lat: 91, lng: 0 } },
  (d) => { d.address.geo = { lat: 10, lng: -181 } },
  (d) => { d.address.geo = { lat: 10 } },
  (d) => { d.nickname = null },
  (d) => { d.address = [d.address] },
]
// Three documents in four are valid, as most input to a validator is; each of
// the 18 ways to break a rule appears once.
export const cases = Array.from({ length: 72 }, (_, i) => {
  const d = valid(i)
  if (i % 4 !== 3) return { input: d, expected: true }
  breakers[Math.floor(i / 4) % breakers.length](d)
  return { input: d, expected: false }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.strictEqual(outputs[i], expected, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => Number(value)
