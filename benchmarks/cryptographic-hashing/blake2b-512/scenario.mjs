import { strict as assert } from 'node:assert'
import { createHash } from 'node:crypto'
// Reference: node:crypto BLAKE2b-512 (unkeyed, 64-byte output) over the bytes.
// node:crypto is also one of the entries, so the reference is anchored by the
// published known-answer vectors: "abc" from RFC 7693 Appendix A, and the
// empty message from the BLAKE2 reference test vectors.
const blake2b = (bytes) => createHash('blake2b512').update(bytes).digest()
assert.equal(blake2b(Buffer.alloc(0)).toString('hex'), '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce')
assert.equal(blake2b(Buffer.from('abc')).toString('hex'), 'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923')
// Message bytes, built deterministically: xorshift32 noise, ASCII log text,
// a 0..255 ramp, zeros and 0xff runs, in turn.
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'request', 'user', 'session', 'GET', 'POST']
const fill = (i, length) => {
  const out = Buffer.alloc(length)
  const kind = i % 5
  if (kind === 0) {
    let x = (i + 1) * 2654435761 >>> 0 || 1
    for (let k = 0; k < length; k++) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; out[k] = x & 0xff }
  } else if (kind === 1) {
    let s = ''
    for (let j = 0; s.length < length; j++) s += `2026-10-09T08:${String(j % 60).padStart(2, '0')}:00Z ${words[(i + j) % words.length]} id=${i * 7919 + j} status=${200 + (j % 5)}\n`
    out.write(s.slice(0, length), 'latin1')
  } else if (kind === 2) {
    for (let k = 0; k < length; k++) out[k] = (k + i) & 0xff
  } else if (kind === 4) {
    out.fill(0xff)
  }
  return out
}
// Lengths around BLAKE2b's 128-byte block (the last block is compressed with
// the final flag, so 127/128/129 and 255/256/257 take different paths), then
// growing to 1 MiB. Fixture 1 is the "abc" vector, fixture 2 one million "a".
const lengths = [0, 3, 1000000, 1, 2, 4, 31, 32, 33, 63, 64, 65, 111, 112, 113, 127, 128, 129, 191, 192, 255, 256, 257, 383, 384, 385, 511, 512, 1000, 1023, 1024, 2048, 4095, 4096, 8192, 10000, 16384, 32768, 50000, 65536, 100000, 131072, 200000, 262144, 400000, 524288, 1048576, 129]
const message = (i, length) => i === 1 ? Buffer.from('abc') : i === 2 ? Buffer.alloc(length, 'a') : fill(i, length)
// An input is the message as a lowercase hex string (fixtures are shared as
// JSON); each adapter's prepare turns it into bytes once, before any timing.
export const cases = lengths.map((length, i) => {
  const bytes = message(i, length)
  return { input: bytes.toString('hex'), expected: Array.from(blake2b(bytes)) }
})
const bytesOf = (x) => {
  if (x instanceof ArrayBuffer) return Array.from(new Uint8Array(x))
  if (ArrayBuffer.isView(x)) return Array.from(new Uint8Array(x.buffer, x.byteOffset, x.byteLength))
  if (Array.isArray(x)) return x
  if (x && x.type === 'Buffer' && Array.isArray(x.data)) return x.data
  // A Go []byte is marshalled by encoding/json as base64.
  if (typeof x === 'string' && /^[A-Za-z0-9+/]{86}==$/.test(x)) return Array.from(Buffer.from(x, 'base64'))
  assert.fail('64 digest bytes required')
}
const verifyOne = (i, output) => assert.deepStrictEqual(bytesOf(output), cases[i].expected, `fixture ${i}`)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.byteLength
// Proofs that the check can fail: a digest with one bit flipped, a digest cut
// to 63 bytes, the digest of the previous fixture, the hex of the digest, and
// two other 64-byte digests of the same bytes (SHA-512 and SHA3-512) are all
// refused, as is BLAKE2s-256 (a package confusing the two variants).
const flipped = [...cases[5].expected]; flipped[63] ^= 1
assert.throws(() => verifyOne(5, flipped), /fixture 5/)
assert.throws(() => verifyOne(5, cases[5].expected.slice(0, 63)), /fixture 5/)
assert.throws(() => verifyOne(6, cases[5].expected), /fixture 6/)
assert.throws(() => verifyOne(1, Buffer.from(cases[1].expected).toString('hex')))
assert.throws(() => verifyOne(1, createHash('sha512').update('abc').digest()), /fixture 1/)
assert.throws(() => verifyOne(1, createHash('sha3-512').update('abc').digest()), /fixture 1/)
assert.throws(() => verifyOne(1, createHash('blake2s256').update('abc').digest()), /fixture 1/)
// The base64 form a Go []byte takes is accepted only when it holds the digest.
verifyOne(1, Buffer.from(cases[1].expected).toString('base64'))
assert.throws(() => verifyOne(1, Buffer.from(flipped).toString('base64')), /fixture 1/)
