import { strict as assert } from 'node:assert'
const words = ['alpha', 'beta', 'gamma', 'São Paulo', '日本語', 'naïve 😀', '']
const defaults = (i) => ({
  name: `app-${i}`,
  debug: false,
  retries: 3,
  server: { host: 'localhost', port: 3000 + i, tls: { enabled: false, cert: null, ciphers: { min: 'TLS1.2', max: 'TLS1.3' } }, headers: { 'x-powered-by': 'none', 'cache-control': 'no-store' } },
  logging: { level: 'info', targets: { console: { enabled: true, color: true }, file: { enabled: false, path: '/var/log/app.log', rotate: { sizeMb: 50, keep: 7 } } } },
  features: { search: true, export: false, beta: { ui: false, api: false } },
  limits: { requests: 100, burst: { size: 10, windowMs: 1000 } },
  'ключ': { 'café': words[i % words.length] },
})
const preset = (i) => ({
  debug: i % 3 === 0,
  server: { port: 8000 + i, tls: { enabled: true, cert: `/etc/ssl/${i}.pem`, ciphers: { max: 'TLS1.3' } } },
  logging: { level: ['debug', 'warn', 'error'][i % 3], targets: { file: { enabled: true, rotate: { keep: 14 + i } } } },
  features: { export: true, beta: { ui: i % 2 === 0 } },
  limits: { burst: { size: 20 + i } },
})
const user = (i) => {
  const o = { name: `user-${i}`, server: { headers: { 'x-user': words[i % words.length], 'cache-control': 'max-age=60' } }, features: { search: false, extra: { depth: { level: { value: i } } } } }
  if (i % 4 === 0) o.limits = 0
  if (i % 4 === 1) o.server.tls = null
  if (i % 4 === 2) o.logging = { targets: { console: false } }
  if (i % 4 === 3) o.name = ''
  return o
}
const overrides = (i) => {
  const o = { retries: i % 5 === 0 ? 0 : i, logging: { targets: { console: { color: false } } } }
  if (i % 6 === 0) o.limits = { requests: 1, burst: {} }
  if (i % 6 === 1) o.features = { beta: 'on' }
  if (i % 6 === 2) o.server = { tls: { ciphers: { min: 'TLS1.0' } } }
  if (i % 6 === 3) o.features = { beta: { api: true }, search: { fuzzy: { enabled: true } } }
  if (i % 6 === 4) o.debug = null
  if (i % 6 === 5) o.server = {}
  return o
}
const build = (i) => [defaults(i), preset(i), user(i), overrides(i)]
const isObject = (x) => x !== null && typeof x === 'object'
const reference = (target, source) => {
  for (const [key, value] of Object.entries(source)) {
    if (isObject(value)) target[key] = reference(isObject(target[key]) ? target[key] : {}, value)
    else target[key] = value
  }
  return target
}
const merge = (sources) => sources.reduce((acc, source) => reference(acc, source), {})
export const cases = Array.from({ length: 36 }, (_, i) => ({ input: build(i), expected: merge(build(i)) }))
const plain = (x) => {
  if (x !== null && typeof x === 'object') return !Array.isArray(x) && Object.getPrototypeOf(x) === Object.prototype && Object.values(x).every(plain)
  return x !== undefined
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.ok(plain(outputs[i]), `fixture ${i}: plain objects required`)
    assert.deepStrictEqual(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => {
  const outputs = cases.map(({ input }) => operation(input))
  verifyResults(outputs)
  cases.forEach(({ input }, i) => assert.deepStrictEqual(input, build(i), `fixture ${i}: sources must not be modified`))
}
// Every merged result has a string `name` and a numeric `retries`; reading
// them allocates nothing (Object.keys would build an array on every timed call).
export const consume = (value) => value.name.length + value.retries
