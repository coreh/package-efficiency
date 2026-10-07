import { strict as assert } from 'node:assert'
import { createHmac } from 'node:crypto'
const words = ['alpha', 'beta', 'café', '日本語', 'São Paulo', 'naïve 😀', 'plain']
const roles = ['admin', 'editor', 'viewer', 'billing', 'support']
const claimsFor = (i, exp) => {
  const claims = {
    iss: `https://auth${i % 4}.example.com/`,
    sub: `user-${1000 + i}`,
    iat: 1600000000 + i * 61,
    exp,
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
const b64 = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url')
const sign = (header, payload, secret) => {
  const body = `${header}.${payload}`
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`
}
const secrets = ['s3cret', 'correct horse battery staple', 'k'.repeat(32), 'ünïcödé-sëcret-🔑', 'x'.repeat(64), 'a-much-longer-shared-secret-'.repeat(4)]
const header = b64({ alg: 'HS256', typ: 'JWT' })
// Kinds repeat every 10 fixtures: 7 valid, 1 payload tampered after signing,
// 1 signed with another secret, 1 signed correctly but expired.
const kinds = ['valid', 'valid', 'tampered', 'valid', 'valid', 'expired', 'valid', 'wrong-secret', 'valid', 'valid']
export const cases = Array.from({ length: 60 }, (_, i) => {
  const kind = kinds[i % kinds.length]
  const secret = secrets[i % secrets.length]
  const exp = kind === 'expired' ? 1650000000 + i : 4102444800 + i
  const claims = claimsFor(i, exp)
  let token = sign(header, b64(claims), secret)
  if (kind === 'tampered') {
    // Same signature, but the payload now claims admin rights.
    const [h, , s] = token.split('.')
    token = `${h}.${b64({ ...claims, roles: ['admin', 'superuser'] })}.${s}`
  } else if (kind === 'wrong-secret') {
    token = sign(header, b64(claims), `${secret}-other`)
  }
  const status = kind === 'valid' ? 'valid' : kind === 'expired' ? 'expired' : 'invalid-signature'
  return { input: { token, secret }, expected: { status, claims: status === 'valid' ? claimsFor(i, exp) : null } }
})
const plain = (x) => {
  if (Array.isArray(x)) return x.every(plain)
  if (x !== null && typeof x === 'object') return Object.getPrototypeOf(x) === Object.prototype && Object.values(x).every(plain)
  return true
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i] ?? {}
    assert.ok(plain(out.claims), `fixture ${i}: plain object required`)
    assert.equal(out.status, expected.status, `fixture ${i}: status`)
    assert.deepStrictEqual(out.claims, expected.claims, `fixture ${i}: claims`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
// A string status always exists; its length allocates nothing.
export const consume = (value) => value.status.length
