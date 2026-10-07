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
// Each breaker breaks one rule and returns the path of the single resulting error.
const breakers = [
  (d) => { d.id = String(d.id); return '/id' },
  (d) => { d.id = 0; return '/id' },
  (d) => { d.id = 1.5; return '/id' },
  (d) => { d.name = ''; return '/name' },
  (d) => { delete d.email; return '/email' },
  (d) => { d.role = 'owner'; return '/role' },
  (d) => { d.active = 'yes'; return '/active' },
  (d) => { const n = d.tags.length; d.tags = [...d.tags, 42]; return `/tags/${n}` },
  (d) => { d.tags = 'a,b'; return '/tags' },
  (d) => { const n = d.scores.length; d.scores = [...d.scores, '1.5']; return `/scores/${n}` },
  (d) => { d.address = null; return '/address' },
  (d) => { delete d.address.zip; return '/address/zip' },
  (d) => { d.address.city = ''; return '/address/city' },
  (d) => { d.address.geo = { lat: 91, lng: 0 }; return '/address/geo/lat' },
  (d) => { d.address.geo = { lat: 10, lng: -181 }; return '/address/geo/lng' },
  (d) => { d.address.geo = { lat: 10 }; return '/address/geo/lng' },
  (d) => { d.nickname = null; return '/nickname' },
  (d) => { d.address = 'home'; return '/address' },
]
let k = 0
export const cases = Array.from({ length: 72 }, (_, i) => {
  const d = valid(i)
  if (i % 9 === 8) return { input: d, expected: '' }
  return { input: d, expected: breakers[k++ % breakers.length](d) }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.strictEqual(outputs[i], expected, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
