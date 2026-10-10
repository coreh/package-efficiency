import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Independent reference: Adler-32 (RFC 1950, section 8.2), byte by byte, with
// both running sums reduced modulo 65521 after every byte, so no deferred
// modulo and no overflow can hide in it.
const BASE = 65521
const reference = (bytes, base = BASE) => {
  let a = 1
  let b = 0
  for (const x of bytes) { a = (a + x) % base; b = (b + a) % base }
  return (b * 65536 + a) >>> 0
}
// Published check values guard the reference itself.
assert.equal(reference(Buffer.alloc(0)), 1)
assert.equal(reference(Buffer.from('Wikipedia')), 0x11e60398)
assert.equal(reference(Buffer.from('abc')), 0x024d0127)
assert.equal(reference(Buffer.from('123456789')), 0x091e01de)
// Message bytes, built deterministically: xorshift32 noise, ASCII log text,
// a 0..255 ramp, zeros and 0xff runs, in turn.
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'request', 'user', 'session', 'GET', 'POST']
const fill = (i, length, kind) => {
  const out = Buffer.alloc(length)
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
const messages = [
  Buffer.alloc(0),
  Buffer.from('Wikipedia'),
  Buffer.from('abc'),
  Buffer.from('123456789'),
]
// Every length up to 33 (tail handling of word-at-a-time and SIMD code), in
// turn noise, text, ramp, zeros and 0xff.
for (let n = 1; n <= 33; n++) messages.push(fill(n, n, n % 5))
// Lengths around block and vector boundaries, then around 5552, the largest
// count of bytes after which a deferred modulo still cannot overflow 32 bits
// (zlib's NMAX), and its multiples. Every boundary length comes as noise and
// as all 0xff bytes, the case that overflows first.
const boundaries = [63, 64, 65, 127, 128, 129, 255, 256, 257, 1023, 1024, 1025, 4095, 4096, 4097, 5550, 5551, 5552, 5553, 5554, 11103, 11104, 11105, 16655, 16656, 16657]
for (const [j, n] of boundaries.entries()) { messages.push(fill(j, n, 0)); messages.push(fill(j, n, 4)) }
// Text, ramps and larger buffers up to 128 KiB.
for (const [j, n] of [300, 1500, 3000, 6000, 9000, 20000].entries()) messages.push(fill(j, n, 1))
for (const [j, n] of [777, 8192, 50000].entries()) messages.push(fill(j, n, 2))
for (const n of [32768, 65536, 131072]) messages.push(fill(n, n, 0))
messages.push(fill(0, 65536, 4), fill(0, 100000, 3))
// An input is the message as a lowercase hex string (fixtures are shared as
// JSON); each adapter's prepare turns it into bytes once, before any timing.
export const cases = messages.map((bytes) => ({ input: bytes.toString('hex'), expected: reference(bytes) }))
const verifyOne = (i, output) => {
  assert.equal(typeof output, 'number', `fixture ${i}: an unsigned 32-bit number is required`)
  assert.equal(output, cases[i].expected, `fixture ${i}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value & 0xffff
// Proofs that the check can fail. The index of the 64 KiB run of 0xff and of
// the 128 KiB noise buffer:
const ff = cases.findIndex(({ input }) => input === 'ff'.repeat(65536))
const big = cases.findIndex(({ input }) => input.length === 2 * 131072)
assert.ok(ff > 0 && big > 0)
const bytesOf = (i) => Buffer.from(cases[i].input, 'hex')
// A deferred modulo in 32-bit sums: reducing every 5552 bytes (zlib's NMAX)
// gives the reference's value on every fixture; waiting longer (5600 bytes)
// overflows on the run of 0xff and is refused.
const lateModulo = (bytes, nmax) => {
  let a = 1
  let b = 0
  for (let k = 0; k < bytes.length; k += nmax) {
    for (const x of bytes.subarray(k, k + nmax)) { a = (a + x) >>> 0; b = (b + a) >>> 0 }
    a %= BASE; b %= BASE
  }
  return (b * 65536 + a) >>> 0
}
for (const i of cases.keys()) assert.equal(lateModulo(bytesOf(i), 5552), cases[i].expected)
assert.throws(() => verifyOne(ff, lateModulo(bytesOf(ff), 5600)), /fixture/)
// Sums modulo 65536 instead of 65521, the halves swapped, the value as a
// signed 32-bit number, as hex text, one more, and another fixture's value.
assert.throws(() => verifyOne(big, reference(bytesOf(big), 65536)), /fixture/)
const swapped = (v) => ((v & 0xffff) * 65536 + (v >>> 16)) >>> 0
assert.throws(() => verifyOne(big, swapped(cases[big].expected)), /fixture/)
const signed = cases.findIndex(({ expected }) => expected >= 0x80000000)
assert.ok(signed >= 0)
assert.throws(() => verifyOne(signed, cases[signed].expected | 0), /fixture/)
assert.throws(() => verifyOne(1, cases[1].expected.toString(16)), /number/)
assert.throws(() => verifyOne(5, cases[5].expected + 1), /fixture 5/)
assert.throws(() => verifyOne(6, cases[5].expected), /fixture 6/)
// The CRC-32 of the same bytes is refused.
const crc32 = (bytes) => {
  let crc = 0xffffffff
  for (const x of bytes) { crc ^= x; for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1 }
  return (crc ^ 0xffffffff) >>> 0
}
assert.throws(() => verifyOne(1, crc32(bytesOf(1))), /fixture 1/)
