import { strict as assert } from 'node:assert'
import { createHmac, hkdfSync } from 'node:crypto'
// Reference: node:crypto hkdfSync with SHA-256 (RFC 5869). node:crypto is also
// one of the entries, so the reference is anchored by the three SHA-256 test
// vectors of RFC 5869, appendix A, which are also the first three fixtures.
const okmHex = ({ ikm, salt, info, length }) => Buffer.from(hkdfSync('sha256', Buffer.from(ikm, 'hex'), Buffer.from(salt, 'hex'), Buffer.from(info, 'hex'), length)).toString('hex')
const run = (from, n) => Buffer.from(Array.from({ length: n }, (_, k) => from + k)).toString('hex')
const rfc5869 = [
  { input: { ikm: '0b'.repeat(22), salt: run(0x00, 13), info: run(0xf0, 10), length: 42 },
    okm: '3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865' },
  { input: { ikm: run(0x00, 80), salt: run(0x60, 80), info: run(0xb0, 80), length: 82 },
    okm: 'b11e398dc80327a1c8e7f78c596a49344f012eda2d4efad8a050cc4c19afa97c59045a99cac7827271cb41c65e590e09da3275600c2f09b8367793a9aca3db71cc30c58179ec3e87c14c01d5c1f3434f1d87' },
  { input: { ikm: '0b'.repeat(22), salt: '', info: '', length: 42 },
    okm: '8da4e775a563c18f715f802a063c5a31b8a11f5c5ee1879ec3454e5f3c738d2d9d201395faa4b61a96c8' },
]
for (const [n, { input, okm }] of rfc5869.entries()) assert.equal(okmHex(input), okm, `RFC 5869 test case ${n + 1}`)
// Deterministic bytes from a fixed-seed generator (xorshift32).
const bytes = (seed, n) => {
  let x = (seed * 2654435761 + 0x9e3779b9) >>> 0 || 1
  const out = Buffer.alloc(n)
  for (let k = 0; k < n; k++) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; out[k] = x & 0xff }
  return out.toString('hex')
}
const text = (s) => Buffer.from(s, 'utf8').toString('hex')
// Input keying material: 16 to 96 bytes (a 32-byte ECDH secret is the common case).
const ikmLengths = [32, 16, 22, 48, 64, 32, 66, 96, 32, 20]
// Salts: empty, short, one hash long, one HMAC block long, and longer than a
// block (which HMAC hashes first).
const saltLengths = [0, 13, 32, 64, 65, 100, 16, 32]
// Info: empty, protocol labels (TLS 1.3 HkdfLabel-like, application strings), binary.
const infos = [
  '',
  text('tls13 key'),
  text('tls13 derived'),
  `0020${text('\x0dtls13 c hs traffic')}20${bytes(7, 32)}`,
  text('my-app v1 encryption key'),
  text('Ed25519 → X25519 session, café 日本語'),
  bytes(11, 3),
  bytes(12, 80),
  text('WebPush: info\x00'),
]
const lengths = [16, 32, 42, 64, 82, 96, 128, 200, 255, 33, 31, 65]
export const cases = [
  ...rfc5869.map(({ input, okm }) => ({ input, expected: okm })),
  ...Array.from({ length: 37 }, (_, i) => {
    const input = {
      ikm: bytes(100 + i, ikmLengths[i % ikmLengths.length]),
      salt: bytes(200 + i, saltLengths[i % saltLengths.length]),
      info: infos[i % infos.length],
      length: lengths[i % lengths.length],
    }
    return { input, expected: okmHex(input) }
  }),
]
// Native runners send hex strings (Rust, Python, Ruby) or base64 strings (Go []byte).
const verifyOne = (i, out) => {
  const { expected } = cases[i]
  assert.equal(typeof out, 'string', `fixture ${i}: encoded bytes required`)
  assert.ok(out === expected || out === Buffer.from(expected, 'hex').toString('base64'), `fixture ${i}: derived bytes differ`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
const hex = (v) => {
  if (v instanceof ArrayBuffer) return Buffer.from(v).toString('hex')
  assert.ok(ArrayBuffer.isView(v), 'a byte array is required')
  return Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString('hex')
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => hex(operation(input))))
export const consume = (result) => result.byteLength
// Every derived key differs, so a constant or an echo fails.
assert.equal(new Set(cases.map(({ expected }) => expected)).size, cases.length, 'derived keys must all differ')
for (const { input, expected } of cases) assert.equal(expected.length, input.length * 2)
// Proofs that the check can fail, on fixture 0 (RFC 5869 test case 1) and
// fixture 10: one bit flipped, one byte short, one byte too many, HKDF with
// SHA-512 or SHA-1, the extracted key (PRK) alone, expand without extract (the
// input keying material used as PRK), salt and input keying material swapped,
// the info left out, another fixture's output, and the bytes as a list of
// numbers are all refused; the right output is accepted as hex and as base64.
assert.equal(createHmac('sha256', Buffer.from(rfc5869[0].input.salt, 'hex')).update(Buffer.from(rfc5869[0].input.ikm, 'hex')).digest('hex'), '077709362c2e32df0ddc3f0dc47bba6390b6c73bb50f9c3122ec844ad7c2b3e5', 'RFC 5869 test case 1 PRK')
const expandOnly = (prk, info, length) => {
  let t = Buffer.alloc(0)
  const out = []
  for (let n = 1; out.length < length; n++) {
    t = createHmac('sha256', prk).update(Buffer.concat([t, info, Buffer.from([n])])).digest()
    out.push(...t)
  }
  return Buffer.from(out.slice(0, length)).toString('hex')
}
for (const i of [0, 10]) {
  const { input, expected } = cases[i]
  const [ikm, salt, info] = [input.ikm, input.salt, input.info].map((h) => Buffer.from(h, 'hex'))
  const right = Buffer.from(expected, 'hex')
  verifyOne(i, expected)
  verifyOne(i, right.toString('base64'))
  assert.equal(expandOnly(createHmac('sha256', salt).update(ikm).digest(), info, input.length), expected, 'extract then expand is HKDF')
  const flipped = Buffer.from(right); flipped[flipped.length - 1] ^= 1
  const wrong = [
    flipped.toString('hex'),
    expected.slice(0, -2),
    okmHex({ ...input, length: input.length + 1 }),
    Buffer.from(hkdfSync('sha512', ikm, salt, info, input.length)).toString('hex'),
    Buffer.from(hkdfSync('sha1', ikm, salt, info, input.length)).toString('hex'),
    createHmac('sha256', salt).update(ikm).digest('hex'),
    expandOnly(ikm, info, input.length),
    okmHex({ ...input, ikm: input.salt || '00', salt: input.ikm }),
    okmHex({ ...input, info: '' }),
    cases[i + 1].expected,
  ]
  for (const w of wrong) assert.throws(() => verifyOne(i, w), new RegExp(`fixture ${i}`))
  assert.throws(() => verifyOne(i, Array.from(right)), new RegExp(`fixture ${i}`))
}
