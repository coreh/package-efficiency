import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { createCipheriv } from 'node:crypto'
// Reference: node:crypto's AES-256-CBC with its default PKCS#7 padding.
// node:crypto is also one of the entries, so the reference is anchored below by
// the CBC-AES256 example of NIST SP 800-38A (F.2.5) and, on every fixture, by
// the scenario's own PKCS#7 padding.
const encryptBytes = (key, iv, text) => {
  const c = createCipheriv('aes-256-cbc', key, iv)
  return Buffer.concat([c.update(text), c.final()])
}
const rawCbc = (key, iv, padded) => {
  const c = createCipheriv('aes-256-cbc', key, iv).setAutoPadding(false)
  return Buffer.concat([c.update(padded), c.final()])
}
// PKCS#7 (RFC 5652, 6.3): n bytes of value n, 1 <= n <= 16, so a message whose
// length is a multiple of 16 gains a whole block of 0x10.
const pkcs7 = (text) => {
  const n = 16 - (text.length % 16)
  return Buffer.concat([text, Buffer.alloc(n, n)])
}
{
  const key = Buffer.from('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4', 'hex')
  const iv = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
  const text = Buffer.from('6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e51', 'hex')
  assert.equal(rawCbc(key, iv, text).toString('hex'), 'f58c4c04d6e5f1ba779eabfb5f7bfbd69cfc4e967edb808d679f777bc6702c7d', 'node:crypto AES-256-CBC does not match NIST SP 800-38A F.2.5')
  // With padding, the two NIST blocks are followed by one more: E(0x10 x 16 xor the last ciphertext block).
  const out = encryptBytes(key, iv, text)
  assert.equal(out.length, 48, 'PKCS#7 adds a whole block to a 32-byte message')
  assert.equal(out.subarray(0, 32).toString('hex'), 'f58c4c04d6e5f1ba779eabfb5f7bfbd69cfc4e967edb808d679f777bc6702c7d')
}
const seal = ({ key, iv, text }) => encryptBytes(Buffer.from(key), Buffer.from(iv), Buffer.from(text))
// The message lines are those of aes-256-ctr and the AEAD tasks.
const lines = [
  (i, j) => `{"id":${i * 1000 + j},"user":"user${j % 97}@example.com","event":"login","ok":${j % 3 !== 0}}`,
  (i, j) => `2026-10-06T12:${String(j % 60).padStart(2, '0')}:00Z INFO request ${j} took ${(i * 7 + j) % 900}ms path=/api/v1/items/${j}`,
  (i, j) => `Pedido ${j}: café com leite, 日本語, 😀 total R$ ${(i + j) * 3},50`,
  (i, j) => `row ${j},${i},alpha,beta,${(i * j) % 1013},"quoted, text"`,
]
// UTF-8 lengths in bytes, exactly: around the 16-byte block (a multiple of 16
// gains a whole padding block, one byte short gains a single 0x01), up to 64 KiB.
const sizes = [0, 1, 2, 15, 16, 17, 31, 32, 33, 47, 48, 63, 64, 65, 100, 127, 128, 200, 255, 256, 300, 500, 511, 512, 700, 1000, 1023, 1024, 1500, 2000, 2047, 2048, 3000, 4095, 4096, 6000, 8191, 8192, 12000, 16383, 16384, 24000, 32767, 32768, 48000, 65520, 65535, 65536]
const message = (i, size) => {
  let s = ''
  for (let j = 0; Buffer.byteLength(s) < size; j++) s += lines[(i + j) % lines.length](i, j) + '\n'
  // Cut by characters until the UTF-8 form fits, then fill to the exact byte length with ASCII.
  let chars = Array.from(s)
  let bytes = Buffer.byteLength(s)
  while (bytes > size) bytes -= Buffer.byteLength(chars.pop())
  return chars.join('') + '.'.repeat(size - bytes)
}
const ascii = (seed, n) => Array.from({ length: n }, (_, k) => String.fromCharCode(33 + ((seed * 31 + k * 17 + (k >> 2) * seed) % 94))).join('')
export const cases = sizes.map((size, i) => {
  const input = { key: ascii(i + 1, 32), iv: ascii(i + 101, 16), text: message(i, size) }
  assert.equal(Buffer.byteLength(input.text), size, `fixture ${i}: message length`)
  const out = seal(input)
  // The oracle's padding is the scenario's own PKCS#7, on every fixture.
  assert.ok(out.equals(rawCbc(Buffer.from(input.key), Buffer.from(input.iv), pkcs7(Buffer.from(input.text)))), `fixture ${i}: node:crypto padding is not PKCS#7`)
  return { input, expected: out.toString('hex') }
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
// Proofs that the check can fail. On fixture 27 (1,024 bytes, a multiple of 16):
// the last byte flipped, the ciphertext without its padding block (no padding),
// zero padding instead of PKCS#7, the IV put in front of the ciphertext, ECB and
// CTR of the same input, CBC with a zero IV, the plaintext itself, another
// fixture's output and the bytes as a list of numbers are all refused. On
// fixture 26 (1,023 bytes): zero padding, which there differs from PKCS#7 in one
// byte only. The right output is accepted as hex and as base64.
{
  const i = 27
  const { input, expected } = cases[i]
  const [key, iv, text] = [input.key, input.iv, input.text].map((s) => Buffer.from(s))
  assert.equal(text.length, 1024)
  const right = Buffer.from(expected, 'hex')
  verifyOne(i, expected)
  verifyOne(i, right.toString('base64'))
  const flipped = Buffer.from(right); flipped[flipped.length - 1] ^= 1
  assert.throws(() => verifyOne(i, hex(flipped)), /fixture 27/)
  assert.throws(() => verifyOne(i, hex(rawCbc(key, iv, text))), /fixture 27/)
  assert.throws(() => verifyOne(i, hex(rawCbc(key, iv, Buffer.concat([text, Buffer.alloc(16)])))), /fixture 27/)
  assert.throws(() => verifyOne(i, hex(Buffer.concat([iv, right]))), /fixture 27/)
  const ecb = createCipheriv('aes-256-ecb', key, null)
  assert.throws(() => verifyOne(i, hex(Buffer.concat([ecb.update(text), ecb.final()]))), /fixture 27/)
  const ctr = createCipheriv('aes-256-ctr', key, iv)
  assert.throws(() => verifyOne(i, hex(Buffer.concat([ctr.update(text), ctr.final()]))), /fixture 27/)
  assert.throws(() => verifyOne(i, hex(encryptBytes(key, Buffer.alloc(16), text))), /fixture 27/)
  assert.throws(() => verifyOne(i, hex(text)), /fixture 27/)
  assert.throws(() => verifyOne(i, cases[i + 1].expected), /fixture 27/)
  assert.throws(() => verifyOne(i, Array.from(right)), /fixture 27/)
  const j = 26
  const short = cases[j].input
  assert.equal(Buffer.byteLength(short.text), 1023)
  assert.throws(() => verifyOne(j, hex(rawCbc(Buffer.from(short.key), Buffer.from(short.iv), Buffer.concat([Buffer.from(short.text), Buffer.alloc(1)])))), /fixture 26/)
}
