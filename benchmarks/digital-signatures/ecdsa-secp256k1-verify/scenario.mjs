import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { createHash, createHmac, createPublicKey, verify as cryptoVerify } from 'node:crypto'

// secp256k1 (SEC 2, section 2.4.1): y^2 = x^3 + 7 over F_p, base point G of order n.
const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n
const G = [0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n, 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n]
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
  const m = (3n * x * x) % P
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
const hex32 = (v) => v.toString(16).padStart(64, '0')
const encode = ([x, y], compressed) => compressed ? (y & 1n ? '03' : '02') + hex32(x) : '04' + hex32(x) + hex32(y)
const decode = (hex) => {
  const x = big(hex.slice(2, 66))
  if (hex.length === 130 && hex.startsWith('04')) return [x, big(hex.slice(66))]
  assert.ok(hex.length === 66 && (hex.startsWith('02') || hex.startsWith('03')), 'SEC1 key')
  let y = pow(mod(x ** 3n + 7n), (P + 1n) / 4n)
  if ((y & 1n) !== BigInt(hex.startsWith('03'))) y = P - y
  return [x, y]
}
// The scenario's own ECDSA verifier (SEC 1, section 4.1.4) over a 32-byte digest.
const reference = ({ publicKey, signature, digest }) => {
  const r = big(signature.slice(0, 64)), s = big(signature.slice(64))
  if (r <= 0n || r >= N || s <= 0n || s >= N) return false
  const e = big(digest) % N, w = inv(s, N)
  const point = affine(add(multiply((e * w) % N, G), multiply((r * w) % N, decode(publicKey))))
  return point !== null && point[0] % N === r
}
// Signing with a deterministic nonce derived from the key and the digest by
// HMAC-SHA256, so every process builds the same 48 signatures; s is normalised
// to the low half (BIP 62), which libsecp256k1 requires.
const sign = (d, digestHex) => {
  for (let counter = 0; ; counter++) {
    const k = big(createHmac('sha256', Buffer.from(hex32(d), 'hex')).update(`${digestHex}:${counter}`).digest('hex')) % N
    if (k === 0n) continue
    const r = affine(multiply(k, G))[0] % N
    let s = (inv(k, N) * (big(digestHex) + r * d)) % N
    if (r === 0n || s === 0n) continue
    if (s > N / 2n) s = N - s
    return hex32(r) + hex32(s)
  }
}
// SEC 1 test point: 2G and its compressed form must decode to the same point.
const twoG = affine(double([...G, 1n]))
assert.equal(twoG[0], 0xc6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5n)
assert.deepEqual(decode(encode(twoG, true)), twoG)

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
const sha256 = (text) => createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex')
// 48 keys, deterministic: the private scalar is derived from a hash.
const material = lengths.map((_, i) => {
  const d = big(createHash('sha256').update(`secp256k1-fixture-${i}`).digest('hex')) % (N - 1n) + 1n
  return { d, point: affine(multiply(d, G)) }
})
// Keys alternate in pairs between compressed (33 bytes) and uncompressed (65
// bytes) SEC1, so each form meets valid fixtures and every kind of invalid one.
const compressedAt = (i) => i % 4 >= 2
export const cases = lengths.map((length, i) => {
  const message = make(i, length)
  const digest = sha256(message)
  const signature = sign(material[i].d, digest)
  const compressed = compressedAt(i)
  const kind = i % 2 === 0 ? 'valid' : ['digest', 'signature', 'key'][(i >> 1) % 3]
  const input = { publicKey: encode(material[i].point, compressed), signature, digest }
  // what node:crypto is given to verify the same thing (it hashes the message itself)
  let signed = message
  if (kind === 'digest') {
    // the digest of another message: the original with one character appended
    signed = message + 'x'
    input.digest = sha256(signed)
  } else if (kind === 'signature') {
    // the last bit of s flipped: still in range and still low-s
    input.signature = signature.slice(0, 126) + (parseInt(signature.slice(126), 16) ^ 1).toString(16).padStart(2, '0')
  } else if (kind === 'key') input.publicKey = encode(material[(i + 1) % material.length].point, compressed)
  assert.ok(big(input.signature.slice(64)) <= N / 2n, `fixture ${i}: low-s signature`)
  return { input, expected: kind === 'valid', kind, signed }
})
// Expectations are known from construction. The scenario's own verifier must
// agree with every one of them, and so must node:crypto where the runtime's
// OpenSSL has secp256k1 (Node; Bun's BoringSSL has not), verifying the message
// whose SHA-256 is the digest.
for (const [i, c] of cases.entries()) assert.strictEqual(reference(c.input), c.expected, `fixture ${i} (${c.kind}): the reference disagrees with the construction`)
const SPKI = { 33: '3036301006072a8648ce3d020106052b8104000a032200', 65: '3056301006072a8648ce3d020106052b8104000a034200' }
const nodeKey = (publicKey) => createPublicKey({ key: Buffer.from(SPKI[publicKey.length / 2] + publicKey, 'hex'), format: 'der', type: 'spki' })
let nodeHasCurve = true
try { nodeKey(cases[0].input.publicKey) } catch { nodeHasCurve = false }
if (nodeHasCurve) {
  for (const [i, { input, expected, kind, signed }] of cases.entries()) {
    const ok = cryptoVerify('sha256', Buffer.from(signed, 'utf8'), { key: nodeKey(input.publicKey), dsaEncoding: 'ieee-p1363' }, Buffer.from(input.signature, 'hex'))
    assert.strictEqual(ok, expected, `fixture ${i} (${kind}): node:crypto disagrees with the construction`)
  }
}
for (const c of cases) delete c.signed
export const verifyOne = (i, output) => assert.strictEqual(output, cases[i].expected, `fixture ${i} (${cases[i].kind})`)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
// The check refuses outputs that did not do the job: always true, always
// false, every answer inverted, truthy numbers instead of booleans, and an
// answer that ignores the digest (true unless the key or signature was changed).
const expected = cases.map((c) => c.expected)
assert.throws(() => verifyResults(cases.map(() => true)))
assert.throws(() => verifyResults(cases.map(() => false)))
assert.throws(() => verifyResults(expected.map((v) => !v)))
assert.throws(() => verifyResults(expected.map((v) => (v ? 1 : 0))))
assert.throws(() => verifyResults(cases.map((c) => c.kind === 'valid' || c.kind === 'digest')))
assert.throws(() => verifyResults(expected.slice(1)))
verifyResults(expected)
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (value ? 1 : 0)
