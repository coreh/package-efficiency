import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { createCipheriv } from 'node:crypto'
// Reference: a small ChaCha20 of the scenario's own (RFC 8439, section 2.3:
// state words 12 to 15 are the 32-bit block counter and the 96-bit nonce,
// all little-endian). The task's counter is 0. It needs no cipher from
// node:crypto, so the scenario loads on every runtime (Bun's node:crypto has
// no chacha20); it is anchored by the RFC's own vectors below.
const rotl = (v, c) => (v << c) | (v >>> (32 - c))
const chacha = (key, nonce, text, counter = 0) => {
  const k = new DataView(key.buffer, key.byteOffset, 32)
  const n = new DataView(nonce.buffer, nonce.byteOffset, 12)
  const s = new Uint32Array(16)
  s[0] = 0x61707865; s[1] = 0x3320646e; s[2] = 0x79622d32; s[3] = 0x6b206574
  for (let j = 0; j < 8; j++) s[4 + j] = k.getUint32(j * 4, true)
  s[12] = counter
  for (let j = 0; j < 3; j++) s[13 + j] = n.getUint32(j * 4, true)
  const x = new Uint32Array(16)
  const ks = Buffer.alloc(64)
  const out = Buffer.alloc(text.length)
  const qr = (a, b, c, d) => {
    x[a] += x[b]; x[d] = rotl(x[d] ^ x[a], 16)
    x[c] += x[d]; x[b] = rotl(x[b] ^ x[c], 12)
    x[a] += x[b]; x[d] = rotl(x[d] ^ x[a], 8)
    x[c] += x[d]; x[b] = rotl(x[b] ^ x[c], 7)
  }
  for (let off = 0; off < text.length; off += 64, s[12]++) {
    x.set(s)
    for (let r = 0; r < 20; r += 2) {
      qr(0, 4, 8, 12); qr(1, 5, 9, 13); qr(2, 6, 10, 14); qr(3, 7, 11, 15)
      qr(0, 5, 10, 15); qr(1, 6, 11, 12); qr(2, 7, 8, 13); qr(3, 4, 9, 14)
    }
    for (let j = 0; j < 16; j++) ks.writeUInt32LE((x[j] + s[j]) >>> 0, j * 4)
    for (let j = 0; j < 64 && off + j < text.length; j++) out[off + j] = text[off + j] ^ ks[j]
  }
  return out
}
// Poly1305 and the AEAD of RFC 8439 (sections 2.5 and 2.8), only for the
// proof that ChaCha20-Poly1305 output is refused; anchored by the RFC's
// vectors of sections 2.5.2 and 2.8.2 below.
const leInt = (bytes) => bytes.length ? BigInt(`0x${Buffer.from(bytes).reverse().toString('hex')}`) : 0n
const poly1305 = (otk, msg) => {
  const r = leInt(otk.subarray(0, 16)) & 0x0ffffffc0ffffffc0ffffffc0fffffffn
  const s = leInt(otk.subarray(16, 32))
  const p = (1n << 130n) - 5n
  let acc = 0n
  for (let i = 0; i < msg.length; i += 16) {
    const blk = msg.subarray(i, i + 16)
    acc = ((acc + leInt(blk) + (1n << BigInt(8 * blk.length))) * r) % p
  }
  acc = (acc + s) & ((1n << 128n) - 1n)
  return Buffer.from(acc.toString(16).padStart(32, '0'), 'hex').reverse()
}
const pad16 = (n) => Buffer.alloc((16 - (n % 16)) % 16)
const le64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b }
const aeadSeal = (key, nonce, aad, text) => {
  const ct = chacha(key, nonce, text, 1)
  const tag = poly1305(chacha(key, nonce, Buffer.alloc(32), 0), Buffer.concat([aad, pad16(aad.length), ct, pad16(ct.length), le64(aad.length), le64(ct.length)]))
  return Buffer.concat([ct, tag])
}
assert.equal(poly1305(Buffer.from('85d6be7857556d337f4452fe42d506a80103808afb0db2fd4abff6af4149f51b', 'hex'), Buffer.from('Cryptographic Forum Research Group')).toString('hex'),
  'a8061dc1305136c6c22b8baf0c0127a9', 'RFC 8439 2.5.2')
{
  const out = aeadSeal(Buffer.from(Array.from({ length: 32 }, (_, k) => 0x80 + k)), Buffer.from('070000004041424344454647', 'hex'), Buffer.from('50515253c0c1c2c3c4c5c6c7', 'hex'),
    Buffer.from("Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.")).toString('hex')
  assert.equal(out.slice(0, 32), 'd31a8d34648e60db7b86afbc53ef7ec2', 'RFC 8439 2.8.2 ciphertext')
  assert.equal(out.slice(-32), '1ae10b594f09e26a7e902ecbd0600691', 'RFC 8439 2.8.2 tag')
}
// RFC 8439, A.2, test vector #1: zero key, zero nonce, counter 0, 64 zero bytes.
assert.equal(chacha(Buffer.alloc(32), Buffer.alloc(12), Buffer.alloc(64)).toString('hex'),
  '76b8e0ada0f13d90405d6ae55386bd28bdd219b8a08ded1aa836efcc8b770dc7da41597c5157488d7724e03fb8d84a376a43b8f41518a11cc387b669b2ee6586',
  'RFC 8439 A.2 #1')
// RFC 8439, section 2.4.2 (counter 1), which fixes where the nonce goes in the IV.
assert.equal(chacha(Buffer.from(Array.from({ length: 32 }, (_, k) => k)), Buffer.from('000000000000004a00000000', 'hex'),
  Buffer.from("Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it."), 1).toString('hex').slice(0, 64),
  '6e2e359a2568f98041ba0728dd0d6981e97e7aec1d4360c20a27afccfd9fae0b', 'RFC 8439 2.4.2')
const encrypt = ({ key, nonce, text }) => chacha(Buffer.from(key), Buffer.from(nonce), Buffer.from(text))
// The messages, keys and nonces are those of
// authenticated-encryption/chacha20-poly1305-seal, so the two tasks encrypt
// the same inputs.
const lines = [
  (i, j) => `{"id":${i * 1000 + j},"user":"user${j % 97}@example.com","event":"login","ok":${j % 3 !== 0}}`,
  (i, j) => `2026-10-06T12:${String(j % 60).padStart(2, '0')}:00Z INFO request ${j} took ${(i * 7 + j) % 900}ms path=/api/v1/items/${j}`,
  (i, j) => `Pedido ${j}: café com leite, 日本語, 😀 total R$ ${(i + j) * 3},50`,
  (i, j) => `row ${j},${i},alpha,beta,${(i * j) % 1013},"quoted, text"`,
]
// Lengths around the 64-byte ChaCha20 block.
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
  const input = { key: ascii(i + 1, 32), nonce: ascii(i + 101, 12), text: message(i, size) }
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
// flipped, the keystream started at block counter 1 (as ChaCha20-Poly1305 and
// RFC 8439 2.4.2 do) instead of 0, the nonce with its bytes reversed, the
// output cut short by one byte, the
// ChaCha20-Poly1305 ciphertext with its tag, AES-256-CTR of the same input, the
// plaintext itself, another fixture's output and the bytes as a list of numbers
// are all refused; the right output is accepted as hex and as base64.
{
  const i = 30
  const { input, expected } = cases[i]
  const [key, nonce, text] = [input.key, input.nonce, input.text].map((s) => Buffer.from(s))
  const right = Buffer.from(expected, 'hex')
  assert.equal(right.length, text.length, 'a stream cipher keeps the length')
  verifyOne(i, expected)
  verifyOne(i, right.toString('base64'))
  const flipped = Buffer.from(right); flipped[flipped.length - 1] ^= 1
  assert.throws(() => verifyOne(i, hex(flipped)), /fixture 30/)
  assert.throws(() => verifyOne(i, hex(chacha(key, nonce, text, 1))), /fixture 30/)
  assert.throws(() => verifyOne(i, hex(chacha(key, Buffer.from(nonce).reverse(), text))), /fixture 30/)
  assert.throws(() => verifyOne(i, hex(right.subarray(0, -1))), /fixture 30/)
  assert.throws(() => verifyOne(i, hex(aeadSeal(key, nonce, Buffer.alloc(0), text))), /fixture 30/)
  const ctr = createCipheriv('aes-256-ctr', key, Buffer.concat([nonce, Buffer.alloc(4)]))
  assert.throws(() => verifyOne(i, hex(Buffer.concat([ctr.update(text), ctr.final()]))), /fixture 30/)
  assert.throws(() => verifyOne(i, hex(text)), /fixture 30/)
  assert.throws(() => verifyOne(i, cases[i + 1].expected), /fixture 30/)
  assert.throws(() => verifyOne(i, Array.from(right)), /fixture 30/)
}
