import { strict as assert } from 'node:assert'
import { createHmac } from 'node:crypto'
const words = ['alpha', 'beta', 'café', '日本語', 'São Paulo', 'naïve 😀', 'plain']
const roles = ['admin', 'editor', 'viewer', 'billing', 'support']
const claimsFor = (i) => {
  const claims = {
    iss: `https://auth${i % 4}.example.com/`,
    sub: `user-${1000 + i}`,
    iat: 1760000000 + i * 61,
    exp: 4102444800 + i,
    jti: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    name: `${words[i % words.length]} User ${i}`,
    email: `user${i}@example.com`,
    email_verified: i % 2 === 0,
    roles: Array.from({ length: 1 + i % 5 }, (_, j) => roles[(i + j) % roles.length]),
  }
  if (i % 2 === 1) claims.org = { id: i, name: `Org ${words[(i + 2) % words.length]}`, plan: ['free', 'pro', 'team'][i % 3], seats: 5 * i }
  if (i % 4 === 0) claims.prefs = { theme: 'dark', locale: 'pt-BR', flags: Array.from({ length: i % 9 }, (_, j) => `flag_${j}`), quota: null }
  if (i % 6 === 0) claims.scope = Array.from({ length: 10 + i }, (_, j) => `resource${j}:read`).join(' ')
  return claims
}
const secrets = ['s3cret', 'correct horse battery staple', 'k'.repeat(32), 'ünïcödé-sëcret-🔑', 'x'.repeat(64), 'a-much-longer-shared-secret-'.repeat(4)]
export const cases = Array.from({ length: 48 }, (_, i) => {
  const claims = claimsFor(i)
  return { input: { claims, secret: secrets[i % secrets.length] }, expected: claimsFor(i) }
})
const plain = (x) => {
  if (Array.isArray(x)) return x.every(plain)
  if (x !== null && typeof x === 'object') return Object.getPrototypeOf(x) === Object.prototype && Object.values(x).every(plain)
  return true
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    const { claims, token } = outputs[i] ?? {}
    assert.ok(plain(claims), `fixture ${i}: plain object required`)
    assert.deepStrictEqual(claims, expected, `fixture ${i}`)
    // The token the adapter signed, checked without any of the packages:
    // three base64url parts, an HS256 header, the claims as payload, and a
    // signature equal to HMAC-SHA256 of "header.payload" under the secret.
    assert.equal(typeof token, 'string', `fixture ${i}: token string required`)
    const parts = token.split('.')
    assert.ok(parts.length === 3 && parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part)), `fixture ${i}: compact JWT of three base64url parts required`)
    const [header, payload, signature] = parts
    assert.equal(JSON.parse(Buffer.from(header, 'base64url').toString()).alg, 'HS256', `fixture ${i}: header alg`)
    assert.deepStrictEqual(JSON.parse(Buffer.from(payload, 'base64url').toString()), expected, `fixture ${i}: token payload`)
    assert.equal(signature, createHmac('sha256', input.secret).update(`${header}.${payload}`).digest('base64url'), `fixture ${i}: token signature`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
// Every fixture's claims carry a string `sub`; reading its length allocates nothing.
export const consume = (value) => value.claims.sub.length
