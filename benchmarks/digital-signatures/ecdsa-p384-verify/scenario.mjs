import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { createECDH, createHash, createHmac, createPublicKey, verify as cryptoVerify } from 'node:crypto'

// NIST P-384 (FIPS 186-5, SEC 2 secp384r1): y^2 = x^3 - 3x + b over F_p, base point G of order n.
const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000ffffffffn
const N = 0xffffffffffffffffffffffffffffffffffffffffffffffffc7634d81f4372ddf581a0db248b0a77aecec196accc52973n
const B = 0xb3312fa7e23ee7e4988e056be3f82d19181d9c6efe8141120314088f5013875ac656398d8a2ed19d2a85c8edd3ec2aefn
const G = [0xaa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7n, 0x3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5fn]
const mod = (a, m = P) => ((a % m) + m) % m
const pow = (b, e, m = P) => {
  let r = 1n
  for (b = mod(b, m); e > 0n; e >>= 1n, b = (b * b) % m) if (e & 1n) r = (r * b) % m
  return r
}
const inv = (a, m = P) => pow(a, m - 2n, m)
// Jacobian coordinates [X, Y, Z]; Z = 0 is the point at infinity.
const double = ([x, y, z]) => {
  if (z === 0n || y === 0n) return [0n, 1n, 0n]
  const s = (4n * x * y * y) % P
  const zz = (z * z) % P
  const m = mod(3n * (x - zz) * (x + zz)) // 3x^2 + a z^4 with a = -3
  const x3 = mod(m * m - 2n * s)
  return [x3, mod(m * (s - x3) - 8n * y ** 4n), (2n * y * z) % P]
}
const add = (a, b) => {
  if (a[2] === 0n) return b
  if (b[2] === 0n) return a
  const z1z1 = (a[2] * a[2]) % P, z2z2 = (b[2] * b[2]) % P
  const u1 = (a[0] * z2z2) % P, u2 = (b[0] * z1z1) % P
  const s1 = (a[1] * b[2] * z2z2) % P, s2 = (b[1] * a[2] * z1z1) % P
  if (u1 === u2) return s1 === s2 ? double(a) : [0n, 1n, 0n]
  const h = mod(u2 - u1), r = mod(s2 - s1)
  const hh = (h * h) % P, hhh = (h * hh) % P
  const x3 = mod(r * r - hhh - 2n * u1 * hh)
  return [x3, mod(r * (u1 * hh - x3) - s1 * hhh), (a[2] * b[2] * h) % P]
}
const multiply = (k, [x, y]) => {
  let r = [0n, 1n, 0n]
  for (let q = [x, y, 1n]; k > 0n; k >>= 1n, q = double(q)) if (k & 1n) r = add(r, q)
  return r
}
const affine = ([x, y, z]) => {
  if (z === 0n) return null
  const zi = inv(z)
  return [(x * zi * zi) % P, (y * zi * zi * zi) % P]
}
const big = (hex) => BigInt('0x' + (hex || '0'))
const hex48 = (v) => v.toString(16).padStart(96, '0')
const encode = ([x, y]) => '04' + hex48(x) + hex48(y)
const decode = (hex) => {
  assert.ok(hex.length === 194 && hex.startsWith('04'), 'uncompressed SEC1 key')
  return [big(hex.slice(2, 98)), big(hex.slice(98))]
}
const onCurve = ([x, y]) => mod(y * y - x ** 3n + 3n * x - B) === 0n
// The scenario's own ECDSA verifier (SEC 1, section 4.1.4) with SHA-384. The
// digest is 384 bits, as long as n, so it is used whole.
const sha384 = (text) => createHash('sha384').update(Buffer.from(text, 'utf8')).digest('hex')
const reference = ({ publicKey, signature, message }) => {
  const r = big(signature.slice(0, 96)), s = big(signature.slice(96))
  if (r <= 0n || r >= N || s <= 0n || s >= N) return false
  const q = decode(publicKey)
  if (!onCurve(q)) return false
  const e = big(sha384(message)) % N, w = inv(s, N)
  const point = affine(add(multiply((e * w) % N, G), multiply((r * w) % N, q)))
  return point !== null && point[0] % N === r
}
// Signing with a deterministic nonce derived from the key and the digest by
// HMAC-SHA384, so every process builds the same 48 signatures; s is
// normalised to the low half, so libraries that reject high-s signatures
// agree with those that do not.
const sign = (d, digestHex) => {
  for (let counter = 0; ; counter++) {
    const k = big(createHmac('sha384', Buffer.from(hex48(d), 'hex')).update(`${digestHex}:${counter}`).digest('hex')) % N
    if (k === 0n) continue
    const r = affine(multiply(k, G))[0] % N
    let s = (inv(k, N) * (big(digestHex) % N + r * d)) % N
    if (r === 0n || s === 0n) continue
    if (s > N / 2n) s = N - s
    return hex48(r) + hex48(s)
  }
}
// The curve constants are right: G is on the curve and has order n.
assert.ok(onCurve(G), 'G is on P-384')
assert.equal(affine(multiply(N, G)), null, 'n G is the point at infinity')

const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo', 'naïve', '😀 ok', 'request', 'user', 'session']
const unit = (i) => [
  (j) => `${words[(i + j) % words.length]}-${j} `,
  (j) => `2026-10-06T12:${String(j % 60).padStart(2, '0')}:00Z INFO user=${i * 31 + j} path=/api/v1/items/${j} status=${200 + (j % 5)}\n`,
  (j) => JSON.stringify({ id: i * 1000 + j, name: words[(i + j) % words.length], tags: ['a', 'b', j], ok: j % 2 === 0 }),
  (j) => `${words[(i * 7 + j) % words.length]} éè 日本 ${j} `,
][i % 4]
const make = (i, length) => {
  const make1 = unit(i)
  let s = ''
  for (let j = 0; s.length < length; j++) s += make1(j)
  return s.slice(0, length).replace(/[\ud800-\udbff]$/, '')
}
const lengths = [1, 2, 3, 15, 31, 32, 54, 55, 63, 64, 65, 100, 111, 112, 127, 128, 129, 200, 255, 256, 300, 500, 512, 700, 1000, 1024, 1500, 2000, 2048, 3000, 4000, 4096, 5000, 6000, 8000, 8192, 20, 40, 80, 160, 320, 640, 1280, 64, 64, 32, 5, 0]
// 48 keys, deterministic: the private scalar is derived from a hash. The
// public point is computed here and must match OpenSSL's (node:crypto ECDH).
const material = lengths.map((_, i) => {
  const d = big(createHash('sha384').update(`p384-fixture-${i}`).digest('hex')) % (N - 1n) + 1n
  const point = affine(multiply(d, G))
  assert.ok(onCurve(point), `key ${i} is on the curve`)
  return { d, publicKey: encode(point) }
})
{
  const ecdh = createECDH('secp384r1')
  ecdh.setPrivateKey(Buffer.from(hex48(material[0].d), 'hex'))
  assert.equal(ecdh.getPublicKey('hex'), material[0].publicKey, 'the scenario computes the same public key as OpenSSL')
}
export const cases = lengths.map((length, i) => {
  const message = make(i, length)
  const signature = sign(material[i].d, sha384(message))
  const kind = i % 2 === 0 ? 'valid' : ['message', 'signature', 'key'][(i >> 1) % 3]
  const input = { publicKey: material[i].publicKey, signature, message }
  if (kind === 'message') {
    // change the message by appending one character
    input.message = message + 'x'
  } else if (kind === 'signature') {
    // the last bit of s flipped: still in range and still low-s
    input.signature = signature.slice(0, 190) + (parseInt(signature.slice(190), 16) ^ 1).toString(16).padStart(2, '0')
  } else if (kind === 'key') input.publicKey = material[(i + 1) % material.length].publicKey
  assert.ok(big(input.signature.slice(96)) <= N / 2n, `fixture ${i}: low-s signature`)
  return { input, expected: kind === 'valid', kind }
})
// Expectations are known from construction. The scenario's own verifier must
// agree with every one of them, and so must node:crypto (OpenSSL on Node and
// Deno, BoringSSL on Bun).
for (const [i, c] of cases.entries()) assert.strictEqual(reference(c.input), c.expected, `fixture ${i} (${c.kind}): the reference disagrees with the construction`)
const SPKI = Buffer.from('3076301006072a8648ce3d020106052b81040022036200', 'hex')
for (const [i, { input, expected, kind }] of cases.entries()) {
  const key = createPublicKey({ key: Buffer.concat([SPKI, Buffer.from(input.publicKey, 'hex')]), format: 'der', type: 'spki' })
  const ok = cryptoVerify('sha384', Buffer.from(input.message, 'utf8'), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(input.signature, 'hex'))
  assert.strictEqual(ok, expected, `fixture ${i} (${kind}): node:crypto disagrees with the construction`)
}
export const verifyOne = (i, output) => assert.strictEqual(output, cases[i].expected, `fixture ${i} (${cases[i].kind})`)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
// The check refuses outputs that did not do the job: always true, always
// false, every answer inverted, truthy numbers instead of booleans, and an
// answer that ignores the message (true unless the key or signature was changed).
const expected = cases.map((c) => c.expected)
assert.throws(() => verifyResults(cases.map(() => true)))
assert.throws(() => verifyResults(cases.map(() => false)))
assert.throws(() => verifyResults(expected.map((v) => !v)))
assert.throws(() => verifyResults(expected.map((v) => (v ? 1 : 0))))
assert.throws(() => verifyResults(cases.map((c) => c.kind === 'valid' || c.kind === 'message')))
assert.throws(() => verifyResults(expected.slice(1)))
verifyResults(expected)
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (value ? 1 : 0)
