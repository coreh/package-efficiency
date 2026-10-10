import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { createHash, createPrivateKey, sign as cryptoSign } from 'node:crypto'

// --- Deterministic 2048-bit RSA keys --------------------------------------
// The primes come from a SHA-256 stream, so every process (and every runtime)
// builds the same four keys. Candidates are sieved by small primes, then
// tested with Miller-Rabin (20 rounds, bases from the same stream).
const E = 65537n
const SMALL = []
for (let n = 3; SMALL.length < 300; n += 2) if (SMALL.every((p) => n % p !== 0)) SMALL.push(n)
const pow = (b, e, m) => {
  let r = 1n
  for (b %= m; e > 0n; e >>= 1n, b = (b * b) % m) if (e & 1n) r = (r * b) % m
  return r
}
const inverse = (a, m) => {
  let [r0, r1, s0, s1] = [a % m, m, 1n, 0n]
  while (r1) {
    const q = r0 / r1
    ;[r0, r1, s0, s1] = [r1, r0 - q * r1, s1, s0 - q * s1]
  }
  assert.equal(r0, 1n, 'not invertible')
  return ((s0 % m) + m) % m
}
const stream = (label) => {
  let counter = 0
  return (bytes) => {
    let hex = ''
    while (hex.length < bytes * 2) hex += createHash('sha256').update(`${label}:${counter++}`).digest('hex')
    return BigInt('0x' + hex.slice(0, bytes * 2))
  }
}
const probablePrime = (n, random) => {
  for (const p of SMALL) if (n % BigInt(p) === 0n) return false
  let d = n - 1n, s = 0n
  while (!(d & 1n)) { d >>= 1n; s++ }
  for (let k = 0; k < 20; k++) {
    let x = pow(2n + (random(128) % (n - 4n)), d, n)
    if (x === 1n || x === n - 1n) continue
    let witness = true
    for (let r = 1n; r < s && witness; r++) if ((x = (x * x) % n) === n - 1n) witness = false
    if (witness) return false
  }
  return true
}
// A 1024-bit prime with its top two bits set (so p*q has exactly 2048 bits)
// and p - 1 prime to e.
const prime = (random) => {
  for (;;) {
    for (let c = random(128) | (3n << 1022n) | 1n; ; c += 2n) {
      if (!probablePrime(c, random)) continue
      if ((c - 1n) % E !== 0n) return c
      break
    }
  }
}
const KEYS = 4
const keys = Array.from({ length: KEYS }, (_, i) => {
  const random = stream(`rsa-pkcs1-sha256-sign-key-${i}`)
  let p = prime(random), q = prime(random)
  if (p < q) [p, q] = [q, p]
  const n = p * q
  const d = inverse(E, (p - 1n) * (q - 1n))
  return { n, e: E, d, p, q, dp: d % (p - 1n), dq: d % (q - 1n), qi: inverse(q, p) }
})
for (const k of keys) assert.equal(k.n.toString(2).length, 2048, '2048-bit modulus')

// --- PKCS#1 RSAPrivateKey (RFC 8017, A.1.2) in DER, then PEM ----------------
const derLength = (n) => n < 128 ? [n] : n < 256 ? [0x81, n] : [0x82, n >> 8, n & 255]
const derInteger = (v) => {
  let hex = v.toString(16)
  if (hex.length % 2) hex = '0' + hex
  if (parseInt(hex.slice(0, 2), 16) & 0x80) hex = '00' + hex
  const body = Buffer.from(hex, 'hex')
  return Buffer.concat([Buffer.from([0x02, ...derLength(body.length)]), body])
}
const pkcs1 = (k) => {
  const body = Buffer.concat([0n, k.n, k.e, k.d, k.p, k.q, k.dp, k.dq, k.qi].map(derInteger))
  const der = Buffer.concat([Buffer.from([0x30, ...derLength(body.length)]), body])
  const b64 = der.toString('base64').match(/.{1,64}/g).join('\n')
  return `-----BEGIN RSA PRIVATE KEY-----\n${b64}\n-----END RSA PRIVATE KEY-----\n`
}
const pems = keys.map(pkcs1)

// --- The scenario's own RSASSA-PKCS1-v1_5 signer (RFC 8017, 8.2.1 and 9.2) ---
const DIGEST_INFO = {
  sha256: '3031300d060960864801650304020105000420',
  sha1: '3021300906052b0e03021a05000414',
}
const reference = (k, message, hash = 'sha256') => {
  const t = DIGEST_INFO[hash] + createHash(hash).update(message).digest('hex')
  const em = '0001' + 'ff'.repeat(256 - 3 - t.length / 2) + '00' + t
  const m = BigInt('0x' + em)
  // CRT: s = s2 + q * (qi * (s1 - s2) mod p)
  const s1 = pow(m, k.dp, k.p), s2 = pow(m, k.dq, k.q)
  const s = s2 + k.q * ((((s1 - s2) % k.p) + k.p) * k.qi % k.p)
  assert.equal(pow(s, k.e, k.n), m, 'reference signature must verify')
  return s.toString(16).padStart(512, '0')
}

// --- Messages ---------------------------------------------------------------
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
const lengths = [0, 1, 3, 15, 32, 55, 64, 100, 128, 200, 256, 500, 512, 1000, 1024, 2000, 2048, 3000, 4096, 5000, 6000, 8000, 8192, 64]
// The last fixture's message carries a suffix found once by search, so that its
// signature begins with a zero byte: a signer that returns the integer's
// minimal bytes (255 of them) instead of the full 256 fails on it.
const ZERO_SUFFIX = ' #162'
const messages = lengths.map((length, i) => make(i, length) + (i === lengths.length - 1 ? ZERO_SUFFIX : ''))

export const cases = messages.map((message, i) => ({
  input: { privateKey: pems[i % KEYS], message },
  expected: reference(keys[i % KEYS], Buffer.from(message, 'utf8')),
}))
assert.ok(cases.at(-1).expected.startsWith('00'), 'the last fixture must have a signature with a leading zero byte')

// node:crypto must read every key as the same key and produce the same
// signature as the scenario's own signer (OpenSSL on Node and Deno, BoringSSL
// on Bun).
for (const [i, { input, expected }] of cases.entries()) {
  const key = createPrivateKey(input.privateKey)
  assert.equal(Buffer.from(key.export({ format: 'jwk' }).n, 'base64url').toString('hex'), keys[i % KEYS].n.toString(16), `fixture ${i}: node:crypto reads another modulus`)
  assert.equal(cryptoSign('sha256', Buffer.from(input.message, 'utf8'), key).toString('hex'), expected, `fixture ${i}: node:crypto disagrees with the reference`)
}

// --- Check ------------------------------------------------------------------
// A signature is 256 bytes: a byte array (JavaScript, Rust, a Python or Ruby
// describe), base64 text (a Go []byte through encoding/json) or hex text.
const hexOf = (x, i) => {
  if (typeof x === 'string') {
    if (/^[0-9a-f]{512}$/.test(x)) return x
    if (/^[A-Za-z0-9+/]{342}==$/.test(x)) return Buffer.from(x, 'base64').toString('hex')
    assert.fail(`fixture ${i}: a 256-byte signature as hex or base64 is required, got a string of ${x.length} characters`)
  }
  if (x instanceof ArrayBuffer) x = new Uint8Array(x)
  if (ArrayBuffer.isView(x)) x = Array.from(new Uint8Array(x.buffer, x.byteOffset, x.byteLength))
  if (x && x.type === 'Buffer' && Array.isArray(x.data)) x = x.data
  assert.ok(Array.isArray(x) && x.every((n) => Number.isInteger(n) && n >= 0 && n < 256), `fixture ${i}: signature bytes required`)
  assert.equal(x.length, 256, `fixture ${i}: a 2048-bit signature is 256 bytes`)
  return Buffer.from(x).toString('hex')
}
export const verifyOne = (i, output) => assert.equal(hexOf(output, i), cases[i].expected, `fixture ${i}`)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}

// The check refuses outputs that did not do the job: one fixture's signature
// for every fixture, the signature made with the next fixture's key, the
// signature over the digest with SHA-1 instead of SHA-256, a flipped bit, the
// SHA-256 digest alone, and the leading zero byte dropped.
const bytes = (hex) => Uint8Array.from(Buffer.from(hex, 'hex'))
const good = cases.map(({ expected }) => bytes(expected))
const last = cases.length - 1
assert.throws(() => verifyResults(cases.map(() => good[0])))
assert.throws(() => verifyResults(cases.map((c, i) => i === 1 ? bytes(reference(keys[2 % KEYS], Buffer.from(c.input.message, 'utf8'))) : good[i])))
assert.throws(() => verifyResults(cases.map((c, i) => i === 2 ? bytes(reference(keys[2 % KEYS], Buffer.from(c.input.message, 'utf8'), 'sha1')) : good[i])))
assert.throws(() => verifyResults(good.map((g, i) => i === 3 ? g.map((b, j) => j === 255 ? b ^ 1 : b) : g)))
assert.throws(() => verifyResults(good.map((g, i) => i === 4 ? createHash('sha256').update(cases[4].input.message).digest() : g)))
assert.throws(() => verifyResults(good.map((g, i) => i === last ? g.slice(1) : g)))
assert.throws(() => verifyResults(good.slice(1)))
verifyResults(good)
verifyResults(cases.map(({ expected }, i) => [expected, Buffer.from(expected, 'hex').toString('base64'), Array.from(bytes(expected)), Buffer.from(expected, 'hex')][i % 4]))

export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
