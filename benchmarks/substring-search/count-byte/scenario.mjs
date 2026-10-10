import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Reference: a plain byte-by-byte count of 0x0a, written here and used for
// every expected value.
const NEWLINE = 0x0a
const reference = (bytes) => { let n = 0; for (let k = 0; k < bytes.length; k++) if (bytes[k] === NEWLINE) n++; return n }
assert.equal(reference(Buffer.alloc(0)), 0)
assert.equal(reference(Buffer.from('a\nb\r\n\n')), 3)
assert.equal(reference(Buffer.from([0x8a, 0x0b, 0x09, 0x1a, 0xa0, 0x0a])), 1)
// Buffers, built deterministically: log text, xorshift32 noise over every byte
// value, long-line UTF-8 prose, CRLF text with blank lines and some bare LF
// line ends, and special buffers (all zeros, all newlines, 0xff with a newline
// every 255 bytes and at both ends), in turn.
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'request', 'user', 'session', 'GET', 'POST', 'cache', 'miss']
const proseWords = ['the', 'river', 'storm', 'letter', 'morning', 'quietly', 'walked', 'home', 'über', 'café', 'São', 'Paulo', '日本語', 'naïve', 'and', 'of']
const text = (length, line) => {
  const parts = []
  for (let j = 0, n = 0; n < length; j++) { const part = line(j); parts.push(part); n += Buffer.byteLength(part) }
  return Buffer.from(parts.join('')).subarray(0, length)
}
const fill = (i, length) => {
  const kind = i % 5
  if (kind === 0) return text(length, (j) => `2026-10-09T08:${String(j % 60).padStart(2, '0')}:00Z ${words[(i + j) % words.length]} id=${i * 7919 + j} status=${200 + (j % 5)} path=/api/v1/items/${j}\n`)
  if (kind === 1) {
    const out = Buffer.alloc(length)
    let x = (i + 1) * 2654435761 >>> 0 || 1
    for (let k = 0; k < length; k++) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; out[k] = x & 0xff }
    return out
  }
  if (kind === 2) return text(length, (j) => proseWords[(i * 3 + j * 7) % proseWords.length] + ((j + 1) % 150 === 0 ? '.\n' : ' '))
  if (kind === 3) return text(length, (j) => j % 6 === 5 ? '\r\n' : j % 9 === 7 ? `bare line ${j}\n` : `Header-${j % 11}: value ${i}-${j}\r\n`)
  const special = Math.floor(i / 5) % 3
  if (special === 0) return Buffer.alloc(length)
  if (special === 1) return Buffer.alloc(length, NEWLINE)
  const out = Buffer.alloc(length, 0xff)
  for (let k = 0; k < length; k += 255) out[k] = NEWLINE
  out[length - 1] = NEWLINE
  return out
}
// Lengths from 1 KiB to 8 MiB, with odd lengths for the tail of word-at-a-time
// and SIMD loops; about 12.5 MiB in all.
const lengths = [1024, 1023, 1025, 1031, 2048, 3000, 4096, 4097, 8192, 10000, 16384, 32768, 65536, 65537, 100000, 131072, 262144, 500000, 524288, 1048576, 1048577, 2097152, 8388608]
// An input is the buffer as a lowercase hex string (fixtures are shared as
// JSON); each adapter's prepare turns it into bytes once, before any timing.
export const cases = lengths.map((length, i) => {
  const bytes = fill(i, length)
  assert.equal(bytes.length, length)
  return { input: bytes.toString('hex'), expected: reference(bytes) }
})
// The fixtures hold a buffer with no newline and one made only of newlines.
assert.ok(cases.some(({ expected }) => expected === 0))
assert.ok(cases.some(({ input, expected }) => expected === input.length / 2))
export const verifyOne = (i, output) => {
  assert.equal(typeof output, 'number', `fixture ${i}: a number is required`)
  assert.equal(output, cases[i].expected, `fixture ${i}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value & 0xffff
// Proofs that the check can fail: a count off by one either way (one more is
// also the count of lines of a text without a final newline), the count of
// carriage returns, another fixture's count and the count as text are refused.
const countByte = (i, byte) => { const b = Buffer.from(cases[i].input, 'hex'); let n = 0; for (const x of b) if (x === byte) n++; return n }
assert.throws(() => verifyOne(0, cases[0].expected + 1), /fixture 0/)
assert.throws(() => verifyOne(0, cases[0].expected - 1), /fixture 0/)
assert.throws(() => verifyOne(3, countByte(3, 0x0d)), /fixture 3/)
assert.throws(() => verifyOne(1, countByte(1, 0x0d)), /fixture 1/)
assert.throws(() => verifyOne(6, cases[5].expected), /fixture 6/)
assert.throws(() => verifyOne(0, String(cases[0].expected)), /fixture 0/)
assert.throws(() => verifyOne(2, cases[2].expected + 1), /fixture 2/)
