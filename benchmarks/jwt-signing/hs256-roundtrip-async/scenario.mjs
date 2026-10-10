import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { createHmac } from 'node:crypto'
// The asynchronous form of jwt-signing/hs256-roundtrip: the same claims,
// written out again here because a scenario is loaded alone beside each
// adapter. Keep the two in step. The secrets differ: every one here is at
// least 32 bytes of UTF-8, the size of the HS256 hash, which RFC 7518 (3.2)
// requires and @cross/jwt enforces.
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
const secrets = ['s3cret-'.repeat(5), 'correct horse battery staple 2026', 'k'.repeat(32), 'ünïcödé-sëcret-🔑-ünïcödé', 'x'.repeat(64), 'a-much-longer-shared-secret-'.repeat(4)]
for (const secret of secrets) assert.ok(Buffer.byteLength(secret) >= 32, `secret ${JSON.stringify(secret)} is shorter than 32 bytes`)
export const cases = Array.from({ length: 48 }, (_, i) => ({ input: { claims: claimsFor(i), secret: secrets[i % secrets.length] }, expected: claimsFor(i) }))
const plain = (x) => {
  if (Array.isArray(x)) return x.every(plain)
  if (x !== null && typeof x === 'object') return Object.getPrototypeOf(x) === Object.prototype && Object.values(x).every(plain)
  return true
}
const base64url = /^[A-Za-z0-9_-]+$/
// A result is { claims, token }: the claims as the package's verify returned
// them, and the token the package signed.
export const verifyOne = (i, output) => {
  const { input, expected } = cases[i]
  if (typeof output === 'string') output = JSON.parse(output)
  assert.ok(output && typeof output === 'object', `fixture ${i}: a result object is required`)
  const { claims, token } = output
  assert.ok(plain(claims), `fixture ${i}: plain object required`)
  assert.deepStrictEqual(claims, expected, `fixture ${i}: verified claims`)
  // The token, checked without any of the packages: three base64url parts,
  // an HS256 header, the claims as payload, and a signature equal to
  // HMAC-SHA256 of "header.payload" under the secret.
  assert.equal(typeof token, 'string', `fixture ${i}: token string required`)
  const parts = token.split('.')
  assert.ok(parts.length === 3 && parts.every((part) => base64url.test(part)), `fixture ${i}: compact JWT of three base64url parts required`)
  const [header, payload, signature] = parts
  assert.equal(JSON.parse(Buffer.from(header, 'base64url').toString()).alg, 'HS256', `fixture ${i}: header alg`)
  assert.deepStrictEqual(JSON.parse(Buffer.from(payload, 'base64url').toString()), expected, `fixture ${i}: token payload`)
  assert.equal(signature, createHmac('sha256', input.secret).update(`${header}.${payload}`).digest('base64url'), `fixture ${i}: token signature`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
// Each operation is awaited before the next one starts.
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
// Every fixture's claims carry a string `sub`; reading its length allocates nothing.
export const consume = (value) => value.claims.sub.length

// The check refuses what did not sign and verify as asked.
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
const signed = (headerValue, claims, secret) => {
  const unsigned = `${encode(headerValue)}.${encode(claims)}`
  return `${unsigned}.${createHmac('sha256', secret).update(unsigned).digest('base64url')}`
}
const good = cases.map(({ input, expected }) => ({ claims: expected, token: signed({ alg: 'HS256', typ: 'JWT' }, input.claims, input.secret) }))
verifyResults(good)
// Without typ and with another key order in the header and payload: style, accepted.
verifyResults(cases.map(({ input, expected }) => ({ claims: expected, token: signed({ alg: 'HS256' }, Object.fromEntries(Object.entries(input.claims).reverse()), input.secret) })))
const refuses = (change, what) => assert.throws(() => verifyResults(good.map((o, i) => change(o, i))), undefined, what)
refuses((o, i) => ({ claims: cases[i].input.claims, token: `${encode({ alg: 'none' })}.${encode(cases[i].input.claims)}.` }), 'an unsigned token')
refuses((o, i) => ({ claims: o.claims, token: `${encode({ alg: 'HS256' })}.${encode(cases[i].input.claims)}.${'A'.repeat(43)}` }), 'a made-up signature')
refuses((o, i) => ({ claims: o.claims, token: signed({ alg: 'HS256' }, cases[i].input.claims, secrets[(i + 1) % secrets.length]) }), 'another secret')
refuses((o, i) => ({ claims: o.claims, token: signed({ alg: 'HS512' }, cases[i].input.claims, cases[i].input.secret) }), 'another alg in the header')
refuses((o, i) => ({ claims: o.claims, token: signed({ alg: 'HS256' }, { ...cases[i].input.claims, iat: 1 }, cases[i].input.secret) }), 'a payload with a changed claim')
refuses((o) => ({ claims: { ...o.claims, iat: 1 }, token: o.token }), 'claims with an iat added by the library')
refuses((o) => ({ claims: { header: { alg: 'HS256' }, payload: o.claims }, token: o.token }), 'a wrapper instead of the claims')
refuses((o) => ({ claims: o.claims, token: `${o.token}=` }), 'padded base64')
refuses((o) => ({ claims: o.claims }), 'no token')
refuses((o, i) => good[(i + 1) % good.length], "another fixture's result")
