import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Independent reference: XXH64 (xxHash's 64-bit algorithm, as specified in
// doc/xxhash_spec.md of the xxHash repository), with BigInt arithmetic modulo
// 2^64. Lanes are read little-endian. The options exist only for the proofs
// at the end: another seed, lanes read big-endian, no final avalanche.
const M = (1n << 64n) - 1n
const P1 = 11400714785074694791n, P2 = 14029467366897019727n, P3 = 1609587929392839161n
const P4 = 9650029242287828579n, P5 = 2870177450012600261n
const rotl = (x, r) => ((x << r) | (x >> (64n - r))) & M
const round = (acc, lane) => (rotl((acc + lane * P2) & M, 31n) * P1) & M
const merge = (h, v) => (((h ^ round(0n, v)) * P1 + P4) & M)
const reference = (bytes, { seed = 0n, bigEndian = false, avalanche = true } = {}) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const n = bytes.length, le = !bigEndian
  let i = 0, h
  if (n >= 32) {
    let v1 = (seed + P1 + P2) & M, v2 = (seed + P2) & M, v3 = seed, v4 = (seed - P1) & M
    for (; i + 32 <= n; i += 32) {
      v1 = round(v1, view.getBigUint64(i, le))
      v2 = round(v2, view.getBigUint64(i + 8, le))
      v3 = round(v3, view.getBigUint64(i + 16, le))
      v4 = round(v4, view.getBigUint64(i + 24, le))
    }
    h = (rotl(v1, 1n) + rotl(v2, 7n) + rotl(v3, 12n) + rotl(v4, 18n)) & M
    h = merge(merge(merge(merge(h, v1), v2), v3), v4)
  } else {
    h = (seed + P5) & M
  }
  h = (h + BigInt(n)) & M
  for (; i + 8 <= n; i += 8) h = (rotl(h ^ round(0n, view.getBigUint64(i, le)), 27n) * P1 + P4) & M
  if (i + 4 <= n) { h = (rotl(h ^ ((BigInt(view.getUint32(i, le)) * P1) & M), 23n) * P2 + P3) & M; i += 4 }
  for (; i < n; i++) h = (rotl(h ^ ((BigInt(bytes[i]) * P5) & M), 11n) * P1) & M
  if (!avalanche) return h
  h ^= h >> 33n; h = (h * P2) & M
  h ^= h >> 29n; h = (h * P3) & M
  h ^= h >> 32n
  return h
}
// Published values guard the reference itself: the empty input (the value
// every implementation documents), "a", "abc", the python-xxhash README's
// example sentence, and xxHash's own sanity checks over its generated test
// buffer (byte k is the top byte of PRIME32 * PRIME64^k), with seed 0 and
// seed PRIME32.
const text = (s) => Buffer.from(s, 'latin1')
assert.equal(reference(text('')), 0xef46db3751d8e999n)
assert.equal(reference(text('a')), 0xd24ec4f1a98c6e5bn)
assert.equal(reference(text('abc')), 0x44bc2cf5ad770999n)
assert.equal(reference(text('Nobody inspects the spammish repetition')), 0xfbcea83c8a378bf1n)
const sanity = Buffer.alloc(222)
{
  let g = 2654435761n
  for (let k = 0; k < sanity.length; k++) { sanity[k] = Number(g >> 56n); g = (g * 11400714785074694797n) & M }
}
assert.equal(reference(sanity.subarray(0, 1)), 0xe934a84adb052768n)
assert.equal(reference(sanity.subarray(0, 1), { seed: 2654435761n }), 0x5014607643a9b4c3n)
assert.equal(reference(sanity.subarray(0, 4)), 0x9136a0dca57457een)
assert.equal(reference(sanity.subarray(0, 14)), 0x8282dcc4994e35c8n)
assert.equal(reference(sanity), 0xb641ae8cb691c174n)
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
  text('a'),
  text('abc'),
  text('123456789'),
  text('Nobody inspects the spammish repetition'),
  sanity,
]
// Every length from 1 to 64: below 32 bytes XXH64 skips the four
// accumulators; the tail is consumed in 8-byte, 4-byte and single-byte steps,
// so every remainder modulo 32 is covered with and without a full stripe.
for (let n = 1; n <= 64; n++) messages.push(fill(n, n, n % 5))
// Lengths around stripe, block and vector boundaries, each as noise and as a
// run of 0xff bytes.
const boundaries = [95, 96, 97, 127, 128, 129, 255, 256, 257, 1023, 1024, 1025, 4095, 4096, 4097, 16383, 16384, 16385]
for (const [j, n] of boundaries.entries()) { messages.push(fill(j, n, 0)); messages.push(fill(j, n, 4)) }
// Text, ramps and larger buffers up to 1 MiB.
for (const [j, n] of [300, 1500, 3000, 9000, 20000].entries()) messages.push(fill(j, n, 1))
for (const [j, n] of [777, 8192, 50000].entries()) messages.push(fill(j, n, 2))
for (const n of [65536, 262144, 1048576]) messages.push(fill(n, n, 0))
messages.push(fill(0, 65536, 4), fill(0, 100000, 3))
// An input is the message as a lowercase hex string (fixtures are shared as
// JSON); each adapter's prepare turns it into bytes once, before any timing.
// The expected value is the hash as an unsigned decimal string: fixtures are
// written as JSON for native runtimes, and most XXH64 values neither fit a
// JSON number exactly nor serialize as a BigInt.
export const cases = messages.map((bytes) => ({ input: bytes.toString('hex'), expected: reference(bytes).toString() }))
// A JavaScript entry returns the BigInt itself. A Python, Go or Rust entry
// returns its own unsigned 64-bit integer, and its describe step (Go: the
// result type's MarshalJSON), which runs once per fixture outside timing,
// writes it as a decimal string, because the verifier reads the result as
// JSON and a JSON number above 2^53 would lose its low bits.
const DECIMAL = /^(0|[1-9][0-9]*)$/
export const verifyOne = (i, output) => {
  const { expected } = cases[i]
  if (typeof output === 'bigint') {
    assert.ok(output >= 0n && output <= M, `fixture ${i}: an unsigned 64-bit BigInt is required`)
    assert.equal(output.toString(), expected, `fixture ${i}`)
    return
  }
  assert.equal(typeof output, 'string', `fixture ${i}: a BigInt or an unsigned decimal string is required`)
  assert.match(output, DECIMAL, `fixture ${i}: an unsigned decimal string is required`)
  assert.equal(output, expected, `fixture ${i}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => Number(BigInt.asUintN(16, value))
// Proofs that the check can fail.
const big = cases.findIndex(({ input }) => input.length === 2 * 1048576)
assert.ok(big > 0)
const short = cases.findIndex(({ input }) => input.length === 2 * 30)
assert.ok(short > 0)
const bytesOf = (i) => Buffer.from(cases[i].input, 'hex')
for (const i of [0, 4, short, big]) {
  const bytes = bytesOf(i), want = BigInt(cases[i].expected)
  // Both spellings of the right value pass.
  verifyOne(i, want)
  verifyOne(i, want.toString())
  // Seed 1 instead of 0, lanes read big-endian, no final avalanche.
  assert.throws(() => verifyOne(i, reference(bytes, { seed: 1n })), /fixture/)
  if (bytes.length >= 4) assert.throws(() => verifyOne(i, reference(bytes, { bigEndian: true })), /fixture/)
  assert.throws(() => verifyOne(i, reference(bytes, { avalanche: false })), /fixture/)
  // The low 32 bits only, the value byte-swapped, one more.
  assert.throws(() => verifyOne(i, want & 0xffffffffn), /fixture/)
  const swapped = Buffer.alloc(8); swapped.writeBigUInt64LE(want); assert.throws(() => verifyOne(i, swapped.readBigUInt64BE(0)), /fixture/)
  assert.throws(() => verifyOne(i, (want + 1n) & M), /fixture/)
  // The value as hex text, with a 0x prefix, and as a JSON number (lossy).
  assert.throws(() => verifyOne(i, want.toString(16).padStart(16, '0')), /fixture/)
  assert.throws(() => verifyOne(i, `0x${want.toString(16)}`), /fixture/)
  assert.throws(() => verifyOne(i, Number(want)), /fixture/)
}
// A value at or above 2^63 read as a signed 64-bit integer, in both spellings.
const high = cases.findIndex(({ expected }) => BigInt(expected) >= 1n << 63n)
assert.ok(high >= 0)
assert.throws(() => verifyOne(high, BigInt.asIntN(64, BigInt(cases[high].expected))), /fixture/)
assert.throws(() => verifyOne(high, BigInt.asIntN(64, BigInt(cases[high].expected)).toString()), /fixture/)
// Another fixture's value; and every fixture's value is its own.
assert.throws(() => verifyOne(6, cases[5].expected), /fixture 6/)
assert.throws(() => verifyOne(6, BigInt(cases[5].expected)), /fixture 6/)
// A BigInt outside the unsigned 64-bit range (the right value plus 2^64).
assert.throws(() => verifyOne(0, BigInt(cases[0].expected) + M + 1n), /fixture 0/)
assert.equal(new Set(cases.map(({ expected }) => expected)).size, cases.length)
