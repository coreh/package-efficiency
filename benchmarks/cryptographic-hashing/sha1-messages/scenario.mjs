import { strict as assert } from 'node:assert'
import { createHash } from 'node:crypto'
// Reference: node:crypto SHA-1 over the bytes. node:crypto is also one of the
// entries, so the reference is anchored by the three published known-answer
// vectors of FIPS 180 below ("", "abc" and one million "a").
const sha1 = (bytes) => createHash('sha1').update(bytes).digest()
assert.equal(sha1(Buffer.alloc(0)).toString('hex'), 'da39a3ee5e6b4b0d3255bfef95601890afd80709')
assert.equal(sha1(Buffer.from('abc')).toString('hex'), 'a9993e364706816aba3e25717850c26c9cd0d89d')
assert.equal(sha1(Buffer.alloc(1000000, 'a')).toString('hex'), '34aa973cd4c4daa4f61eeb2bdbad27316534016f')
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
// Lengths around the 55/56/63/64/65-byte padding and block boundaries, then
// growing to 1 MiB. Fixtures 1 and 2 are the "abc" and one-million-"a" vectors.
const lengths = [0, 3, 1000000, 1, 2, 4, 19, 20, 21, 54, 55, 56, 57, 63, 64, 65, 111, 119, 120, 127, 128, 129, 191, 192, 256, 500, 511, 512, 1000, 1023, 1024, 2048, 4095, 4096, 8192, 10000, 16384, 32768, 50000, 65536, 100000, 131072, 200000, 262144, 400000, 524288, 1048576, 64]
const message = (i, length) => i === 1 ? Buffer.from('abc') : i === 2 ? Buffer.alloc(length, 'a') : fill(i, length)
// An input is the message as a lowercase hex string (fixtures are shared as
// JSON); each adapter's prepare turns it into bytes once, before any timing.
export const cases = lengths.map((length, i) => {
  const bytes = message(i, length)
  return { input: bytes.toString('hex'), expected: Array.from(sha1(bytes)) }
})
const bytesOf = (x) => {
  if (x instanceof ArrayBuffer) return Array.from(new Uint8Array(x))
  if (ArrayBuffer.isView(x)) return Array.from(new Uint8Array(x.buffer, x.byteOffset, x.byteLength))
  if (Array.isArray(x)) return x
  if (x && x.type === 'Buffer' && Array.isArray(x.data)) return x.data
  // A Go []byte is marshalled by encoding/json as base64.
  if (typeof x === 'string' && /^[A-Za-z0-9+/]{27}=$/.test(x)) return Array.from(Buffer.from(x, 'base64'))
  assert.fail('20 digest bytes required')
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
// to 19 bytes, the digest of the previous fixture, the hex of the digest, and
// the SHA-256 of the same bytes are all refused.
const flipped = [...cases[5].expected]; flipped[19] ^= 1
assert.throws(() => verifyOne(5, flipped), /fixture 5/)
assert.throws(() => verifyOne(5, cases[5].expected.slice(0, 19)), /fixture 5/)
assert.throws(() => verifyOne(6, cases[5].expected), /fixture 6/)
assert.throws(() => verifyOne(1, Buffer.from(cases[1].expected).toString('hex')))
assert.throws(() => verifyOne(1, createHash('sha256').update('abc').digest()), /fixture 1/)
