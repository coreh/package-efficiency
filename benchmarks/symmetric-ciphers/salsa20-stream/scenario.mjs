import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Reference: a small Salsa20 of the scenario's own (Bernstein's "Salsa20
// specification"), 256-bit key, 64-bit nonce, 64-bit block counter. No
// standard library ships Salsa20, so the reference is anchored by published
// vectors below. `rounds` and `counter` exist only for the refusal proofs.
const rotl = (v, c) => (v << c) | (v >>> (32 - c))
const salsa = (key, nonce, text, counter = 0, rounds = 20) => {
  const k = new DataView(key.buffer, key.byteOffset, 32)
  const n = new DataView(nonce.buffer, nonce.byteOffset, 8)
  const s = new Uint32Array(16)
  s[0] = 0x61707865; s[5] = 0x3320646e; s[10] = 0x79622d32; s[15] = 0x6b206574
  for (let j = 0; j < 4; j++) { s[1 + j] = k.getUint32(j * 4, true); s[11 + j] = k.getUint32(16 + j * 4, true) }
  s[6] = n.getUint32(0, true); s[7] = n.getUint32(4, true)
  const out = Buffer.alloc(text.length)
  const x = new Uint32Array(16)
  const block = Buffer.alloc(64)
  const qr = (a, b, c, d) => {
    x[b] ^= rotl((x[a] + x[d]) | 0, 7); x[c] ^= rotl((x[b] + x[a]) | 0, 9)
    x[d] ^= rotl((x[c] + x[b]) | 0, 13); x[a] ^= rotl((x[d] + x[c]) | 0, 18)
  }
  for (let off = 0, ctr = counter; off < text.length; off += 64, ctr++) {
    s[8] = ctr >>> 0; s[9] = Math.floor(ctr / 2 ** 32)
    x.set(s)
    for (let r = 0; r < rounds; r += 2) {
      qr(0, 4, 8, 12); qr(5, 9, 13, 1); qr(10, 14, 2, 6); qr(15, 3, 7, 11)
      qr(0, 1, 2, 3); qr(5, 6, 7, 4); qr(10, 11, 8, 9); qr(15, 12, 13, 14)
    }
    for (let j = 0; j < 16; j++) block.writeUInt32LE((x[j] + s[j]) >>> 0, j * 4)
    for (let j = 0; j < 64 && off + j < text.length; j++) out[off + j] = text[off + j] ^ block[j]
  }
  return out
}
// eSTREAM (ECRYPT) Salsa20/20 256-bit verified test vectors, set 1 vector 0:
// key 80 00 .. 00, IV zero, the first 64 bytes of keystream.
{
  const key = Buffer.alloc(32); key[0] = 0x80
  assert.equal(salsa(key, Buffer.alloc(8), Buffer.alloc(64)).toString('hex'),
    'e3be8fdd8beca2e3ea8ef9475b29a6e7003951e1097a5c38d23b7a5fad9f6844b22c97559e2723c7cbbd3fe4fc8d9a0744652a83e72a9c461876af4d7ef1a117',
    'eSTREAM Salsa20/20 256-bit set 1 vector 0')
}
// Bytes 192..255 of the same keystream (block 3), which fix the block counter.
{
  const key = Buffer.alloc(32); key[0] = 0x80
  const ks = salsa(key, Buffer.alloc(8), Buffer.alloc(256))
  assert.equal(ks.subarray(192, 256).toString('hex'),
    '57be81f47b17d9ae7c4ff15429a73e10acf250ed3a90a93c711308a74c6216a9ed84cd126da7f28e8abf8bb63517e1ca98e712f4fb2e1a6aed9fdc73291faa17',
    'eSTREAM set 1 vector 0, bytes 192..255')
}
// ChaCha20 (Bernstein's original layout: a 64-bit block counter in state
// words 12 and 13, the 64-bit nonce in words 14 and 15), only for the proof
// that ChaCha20 of the same input is refused. It is the scenario's own, so
// the scenario loads on every runtime (Bun's node:crypto has no chacha20),
// and is anchored by RFC 8439 A.2 test vector #1 (zero key, nonce and
// counter, where both layouts agree).
const chacha20 = (key, nonce, text) => {
  const k = new DataView(key.buffer, key.byteOffset, 32)
  const n = new DataView(nonce.buffer, nonce.byteOffset, 8)
  const s = new Uint32Array(16)
  s[0] = 0x61707865; s[1] = 0x3320646e; s[2] = 0x79622d32; s[3] = 0x6b206574
  for (let j = 0; j < 8; j++) s[4 + j] = k.getUint32(j * 4, true)
  s[14] = n.getUint32(0, true); s[15] = n.getUint32(4, true)
  const x = new Uint32Array(16)
  const ks = Buffer.alloc(64)
  const out = Buffer.alloc(text.length)
  const qr = (a, b, c, d) => {
    x[a] += x[b]; x[d] = rotl(x[d] ^ x[a], 16)
    x[c] += x[d]; x[b] = rotl(x[b] ^ x[c], 12)
    x[a] += x[b]; x[d] = rotl(x[d] ^ x[a], 8)
    x[c] += x[d]; x[b] = rotl(x[b] ^ x[c], 7)
  }
  for (let off = 0; off < text.length; off += 64) {
    x.set(s)
    for (let r = 0; r < 20; r += 2) {
      qr(0, 4, 8, 12); qr(1, 5, 9, 13); qr(2, 6, 10, 14); qr(3, 7, 11, 15)
      qr(0, 5, 10, 15); qr(1, 6, 11, 12); qr(2, 7, 8, 13); qr(3, 4, 9, 14)
    }
    for (let j = 0; j < 16; j++) ks.writeUInt32LE((x[j] + s[j]) >>> 0, j * 4)
    for (let j = 0; j < 64 && off + j < text.length; j++) out[off + j] = text[off + j] ^ ks[j]
    if (++s[12] === 0) s[13]++
  }
  return out
}
assert.equal(chacha20(Buffer.alloc(32), Buffer.alloc(8), Buffer.alloc(64)).toString('hex'),
  '76b8e0ada0f13d90405d6ae55386bd28bdd219b8a08ded1aa836efcc8b770dc7da41597c5157488d7724e03fb8d84a376a43b8f41518a11cc387b669b2ee6586',
  'RFC 8439 A.2 #1')
const encrypt = ({ key, nonce, text }) => salsa(Buffer.from(key), Buffer.from(nonce), Buffer.from(text))
// The messages and keys are those of symmetric-ciphers/chacha20-stream (and so
// of authenticated-encryption/chacha20-poly1305-seal); the nonce is the first
// 8 of that task's 12 characters, since Salsa20's nonce is 64 bits.
const lines = [
  (i, j) => `{"id":${i * 1000 + j},"user":"user${j % 97}@example.com","event":"login","ok":${j % 3 !== 0}}`,
  (i, j) => `2026-10-06T12:${String(j % 60).padStart(2, '0')}:00Z INFO request ${j} took ${(i * 7 + j) % 900}ms path=/api/v1/items/${j}`,
  (i, j) => `Pedido ${j}: café com leite, 日本語, 😀 total R$ ${(i + j) * 3},50`,
  (i, j) => `row ${j},${i},alpha,beta,${(i * j) % 1013},"quoted, text"`,
]
// Lengths around the 64-byte Salsa20 block.
const sizes = [0, 1, 15, 16, 17, 31, 32, 63, 64, 100, 128, 200, 256, 300, 500, 512, 700, 1000, 1024, 1500, 2000, 2048, 3000, 4096]
const message = (i, size) => {
  let s = ''
  for (let j = 0; s.length < size; j++) s += lines[(i + j) % lines.length](i, j) + '\n'
  s = s.slice(0, size)
  return /[\ud800-\udbff]$/.test(s) ? s.slice(0, -1) : s
}
const ascii = (seed, n) => Array.from({ length: n }, (_, k) => String.fromCharCode(33 + ((seed * 31 + k * 17 + (k >> 2) * seed) % 94))).join('')
export const cases = Array.from({ length: 48 }, (_, i) => {
  const size = i < sizes.length ? sizes[i] : [1024, 1200, 2048, 4096, 6000, 8192][i % 6] + i
  const input = { key: ascii(i + 1, 32), nonce: ascii(i + 101, 12).slice(0, 8), text: message(i, size) }
  return { input, expected: encrypt(input).toString('hex') }
})
const hex = (v) => Buffer.from(v).toString('hex')
// Native runners send hex strings (Rust, Python, Ruby) or base64 strings (Go []byte).
export const verifyOne = (i, out) => {
  const { expected } = cases[i]
  assert.equal(typeof out, 'string', `fixture ${i}: encoded bytes required`)
  assert.ok(out === expected || out === Buffer.from(expected, 'hex').toString('base64'), `fixture ${i}: ciphertext differs`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => {
  const out = operation(input)
  assert.ok(out instanceof Uint8Array, 'a byte array is required')
  return hex(out)
}))
export const consume = (result) => result.length
// Proofs that the check can fail, on fixture 30 (1,054 bytes): the last byte
// flipped, the keystream started at block counter 1 instead of 0, the nonce
// with its bytes reversed, the output cut short by one byte, Salsa20/12 and
// Salsa20/8 (reduced rounds) of the same input, ChaCha20 (Bernstein's 64-bit
// nonce layout) of the same input, the plaintext itself, another fixture's
// output and the bytes as a list of numbers are all refused; the right output
// is accepted as hex and as base64.
{
  const i = 30
  const { input, expected } = cases[i]
  const [key, nonce, text] = [input.key, input.nonce, input.text].map((s) => Buffer.from(s))
  assert.equal(nonce.length, 8, 'a 64-bit nonce')
  const right = Buffer.from(expected, 'hex')
  assert.equal(right.length, text.length, 'a stream cipher keeps the length')
  verifyOne(i, expected)
  verifyOne(i, right.toString('base64'))
  const flipped = Buffer.from(right); flipped[flipped.length - 1] ^= 1
  assert.throws(() => verifyOne(i, hex(flipped)), /fixture 30/)
  assert.throws(() => verifyOne(i, hex(salsa(key, nonce, text, 1))), /fixture 30/)
  assert.throws(() => verifyOne(i, hex(salsa(key, Buffer.from(nonce).reverse(), text))), /fixture 30/)
  assert.throws(() => verifyOne(i, hex(right.subarray(0, -1))), /fixture 30/)
  assert.throws(() => verifyOne(i, hex(salsa(key, nonce, text, 0, 12))), /fixture 30/)
  assert.throws(() => verifyOne(i, hex(salsa(key, nonce, text, 0, 8))), /fixture 30/)
  assert.throws(() => verifyOne(i, hex(chacha20(key, nonce, text))), /fixture 30/)
  assert.throws(() => verifyOne(i, hex(text)), /fixture 30/)
  assert.throws(() => verifyOne(i, cases[i + 1].expected), /fixture 30/)
  assert.throws(() => verifyOne(i, Array.from(right)), /fixture 30/)
}
