import { strict as assert } from 'node:assert'
// Input: one Set-Cookie header string. Correct output: an object with exactly
// the keys name, value, path, domain, maxAge, secure, httpOnly, sameSite.
const b64 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
const token = (i, n) => Array.from({ length: n }, (_, k) => b64[(i * 7 + k * 13 + k * k) % b64.length]).join('')
const names = [
  (i) => ['session_id', token(i, 32)],
  (i) => ['csrftoken', token(i + 3, 43)],
  (i) => ['theme', ['dark', 'light', 'auto'][i % 3]],
  (i) => ['lang', ['en-US', 'pt-BR', 'ja-JP', 'de'][i % 4]],
  (i) => ['_ga', `GA1.2.${1000000 + i * 7919}.${1700000000 + i * 31}`],
  (i) => ['cart', String(i * 3 % 17)],
  (i) => ['consent', i % 2 ? 'true' : 'false'],
  (i) => ['cleared', ''],
  (i) => ['__Host-token', token(i + 9, 24)],
  (i) => ['__Secure-id', token(i + 5, 40)],
  (i) => ['jwt', `${token(i, 36)}.${token(i + 1, 80)}.${token(i + 2, 43)}`],
  (i) => ['long', token(i, 200 + i)],
]
const domains = ['example.com', 'www.example.org', 'api.shop.example.co.uk', 'localhost.test']
const paths = ['/', '/app', '/account/settings', '/api/v2']
const sameSites = ['Lax', 'Strict', 'None']
const maxAges = [0, 60, 3600, 86400, 604800, 31536000]
export const cases = Array.from({ length: 48 }, (_, i) => {
  const [name, value] = names[(i * 5) % names.length](i)
  const expected = { name, value, path: null, domain: null, maxAge: null, secure: false, httpOnly: false, sameSite: null }
  const parts = [`${name}=${value}`]
  const attrs = []
  // Attribute subset by a bit mask over i: 0 to 6 attributes, order rotated.
  const mask = (i * 37 + 5) % 64
  if (mask & 1) { const p = paths[i % 4]; expected.path = p; attrs.push([i % 5 === 0 ? 'path' : 'Path', p]) }
  if (mask & 2) { const d = domains[i % 4]; expected.domain = d; attrs.push([i % 7 === 0 ? 'DOMAIN' : 'Domain', d]) }
  if (mask & 4) { const m = maxAges[i % 6]; expected.maxAge = m; attrs.push([i % 6 === 0 ? 'max-age' : 'Max-Age', String(m)]) }
  if (mask & 8) { expected.secure = true; attrs.push([i % 4 === 0 ? 'SECURE' : 'Secure', null]) }
  if (mask & 16) { expected.httpOnly = true; attrs.push([i % 3 === 0 ? 'httponly' : 'HttpOnly', null]) }
  if (mask & 32) {
    const s = sameSites[i % 3]
    expected.sameSite = s.toLowerCase()
    attrs.push([i % 2 ? 'SameSite' : 'samesite', i % 5 === 0 ? s.toLowerCase() : s])
  }
  const rot = i % Math.max(attrs.length, 1)
  for (const [k, v] of [...attrs.slice(rot), ...attrs.slice(0, rot)]) parts.push(v === null ? k : `${k}=${v}`)
  return { input: parts.join('; '), expected }
})
const keys = ['name', 'value', 'path', 'domain', 'maxAge', 'secure', 'httpOnly', 'sameSite']
const plain = (o) => Object.fromEntries(Object.entries(o))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(out !== null && typeof out === 'object' && !Array.isArray(out), `fixture ${i}: object required`)
    assert.deepStrictEqual(Object.keys(out).sort(), [...keys].sort(), `fixture ${i}: keys`)
    assert.deepStrictEqual(plain(out), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
// consume must not allocate: read a few fields only. The name length is
// always non-zero, so the result depends on the parsed cookie.
export const consume = (c) => c.name.length + c.value.length + (c.maxAge === null ? 0 : 1) + (c.secure ? 1 : 0) + (c.sameSite === null ? 0 : 1)
for (const [i, { expected }] of cases.entries()) assert.ok(consume(expected) > 0, `fixture ${i}: consume`)
assert.ok(new Set(cases.map((c) => c.input)).size === cases.length, 'fixtures are distinct')
for (const key of ['path', 'domain', 'maxAge', 'sameSite']) assert.ok(cases.some((c) => c.expected[key] !== null) && cases.some((c) => c.expected[key] === null), key)
