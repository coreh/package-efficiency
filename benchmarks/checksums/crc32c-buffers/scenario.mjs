import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Independent reference: CRC-32C (Castagnoli, iSCSI; RFC 3720, appendix B.4),
// bit by bit: polynomial 0x1EDC6F41 reflected (0x82F63B78), initial value and
// final xor 0xFFFFFFFF.
const CASTAGNOLI = 0x82f63b78
const reference = (bytes, poly = CASTAGNOLI, xorOut = 0xffffffff) => {
  let crc = 0xffffffff
  for (const x of bytes) {
    crc ^= x
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ poly : crc >>> 1
  }
  return (crc ^ xorOut) >>> 0
}
// Published check values guard the reference itself: the empty buffer, the
// catalogue's `123456789`, and the four 32-byte vectors of RFC 3720, B.4
// (listed there in transmission order, little end first).
assert.equal(reference(Buffer.alloc(0)), 0)
assert.equal(reference(Buffer.from('123456789')), 0xe3069283)
assert.equal(reference(Buffer.alloc(32)), 0x8a9136aa)
assert.equal(reference(Buffer.alloc(32, 0xff)), 0x62a8ab43)
assert.equal(reference(Buffer.from(Array.from({ length: 32 }, (_, k) => k))), 0x46dd794e)
assert.equal(reference(Buffer.from(Array.from({ length: 32 }, (_, k) => 31 - k))), 0x113fdb5c)
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
  Buffer.from('123456789'),
  Buffer.alloc(32),
  Buffer.alloc(32, 0xff),
  Buffer.from(Array.from({ length: 32 }, (_, k) => k)),
  Buffer.from(Array.from({ length: 32 }, (_, k) => 31 - k)),
]
// Every length up to 33 (tail handling of 8-byte hardware steps and
// word-at-a-time tables), in turn noise, text, ramp, zeros and 0xff.
for (let n = 1; n <= 33; n++) messages.push(fill(n, n, n % 5))
// Lengths around block and vector boundaries, and around the block sizes at
// which hardware code switches to three interleaved streams (Go uses 3 x 168
// and 3 x 1344 bytes; others 3 x 8 KiB). Each comes as noise and as 0xff.
const boundaries = [63, 64, 65, 127, 128, 129, 255, 256, 257, 503, 504, 505, 1023, 1024, 1025, 4031, 4032, 4033, 4095, 4096, 4097, 24575, 24576, 24577]
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
// Proofs that the check can fail.
const big = cases.findIndex(({ input }) => input.length === 2 * 131072)
assert.ok(big > 0)
const bytesOf = (i) => Buffer.from(cases[i].input, 'hex')
// A table-driven CRC-32C (one byte per step, the usual software form) gives
// the reference's value on every fixture, so the bitwise reference and the
// fixtures agree with the common fast form.
const table = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ CASTAGNOLI : c >>> 1
  return c >>> 0
})
const tabled = (bytes) => {
  let crc = 0xffffffff
  for (const x of bytes) crc = table[(crc ^ x) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
for (const i of cases.keys()) assert.equal(tabled(bytesOf(i)), cases[i].expected)
// The CRC-32 (IEEE, 0xEDB88320) of the same bytes, the Castagnoli register
// without the final xor, the polynomial without reflection (0x1EDC6F41 used
// as if reflected), the value byte-swapped (as RFC 3720 lists it), as a
// signed 32-bit number, as hex text, one more, and another fixture's value.
assert.throws(() => verifyOne(1, reference(bytesOf(1), 0xedb88320)), /fixture 1/)
assert.throws(() => verifyOne(big, reference(bytesOf(big), 0xedb88320)), /fixture/)
assert.throws(() => verifyOne(big, reference(bytesOf(big), CASTAGNOLI, 0)), /fixture/)
assert.throws(() => verifyOne(big, reference(bytesOf(big), 0x1edc6f41)), /fixture/)
const swapped = (v) => Buffer.from(Uint32Array.of(v).buffer).readUInt32BE(0)
assert.throws(() => verifyOne(2, swapped(cases[2].expected)), /fixture 2/)
const signed = cases.findIndex(({ expected }) => expected >= 0x80000000)
assert.ok(signed >= 0)
assert.throws(() => verifyOne(signed, cases[signed].expected | 0), /fixture/)
assert.throws(() => verifyOne(1, cases[1].expected.toString(16)), /number/)
assert.throws(() => verifyOne(5, cases[5].expected + 1), /fixture 5/)
assert.throws(() => verifyOne(6, cases[5].expected), /fixture 6/)
