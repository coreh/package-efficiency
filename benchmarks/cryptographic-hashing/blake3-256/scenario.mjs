import { strict as assert } from 'node:assert'
import { createHash } from 'node:crypto'
// Reference: a small BLAKE3 written here from the specification (hash mode,
// 32-byte output), since no runtime ships BLAKE3. It is anchored below by the
// official test vectors (BLAKE3-team/BLAKE3, test_vectors/test_vectors.json):
// the first 32 bytes of each case's "hash" for input bytes i % 251.
const IV = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]
const PERM = [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8]
const CHUNK_START = 1, CHUNK_END = 2, PARENT = 4, ROOT = 8
const rotr = (x, n) => (x >>> n) | (x << (32 - n))
const compress = (cv, m, counter, blockLen, flags) => {
  const v = [...cv, IV[0], IV[1], IV[2], IV[3], counter >>> 0, Math.floor(counter / 0x100000000) >>> 0, blockLen, flags]
  const g = (a, b, c, d, x, y) => {
    v[a] = (v[a] + v[b] + x) >>> 0; v[d] = rotr(v[d] ^ v[a], 16)
    v[c] = (v[c] + v[d]) >>> 0; v[b] = rotr(v[b] ^ v[c], 12)
    v[a] = (v[a] + v[b] + y) >>> 0; v[d] = rotr(v[d] ^ v[a], 8)
    v[c] = (v[c] + v[d]) >>> 0; v[b] = rotr(v[b] ^ v[c], 7)
  }
  let w = m
  for (let r = 0; r < 7; r++) {
    g(0, 4, 8, 12, w[0], w[1]); g(1, 5, 9, 13, w[2], w[3]); g(2, 6, 10, 14, w[4], w[5]); g(3, 7, 11, 15, w[6], w[7])
    g(0, 5, 10, 15, w[8], w[9]); g(1, 6, 11, 12, w[10], w[11]); g(2, 7, 8, 13, w[12], w[13]); g(3, 4, 9, 14, w[14], w[15])
    w = PERM.map((p) => w[p])
  }
  return v.slice(0, 8).map((x, i) => (x ^ v[i + 8]) >>> 0)
}
const words = (bytes, at, len) => {
  const block = Buffer.alloc(64)
  bytes.copy(block, 0, at, at + len)
  return Array.from({ length: 16 }, (_, i) => block.readUInt32LE(i * 4))
}
// One chunk (at most 1024 bytes, 16 blocks of 64); the last block carries
// CHUNK_END, and ROOT too when the whole message is this one chunk.
const chunk = (bytes, at, len, counter, root) => {
  let cv = IV
  const blocks = Math.max(1, Math.ceil(len / 64))
  for (let j = 0; j < blocks; j++) {
    const n = Math.min(64, len - j * 64)
    const last = j === blocks - 1
    cv = compress(cv, words(bytes, at + j * 64, n), counter, n, (j === 0 ? CHUNK_START : 0) | (last ? CHUNK_END : 0) | (last && root ? ROOT : 0))
  }
  return cv
}
// A subtree: the left side takes the largest power-of-two number of chunks
// that leaves the right side non-empty; a parent node compresses the two
// chaining values with PARENT (and ROOT at the top). root=false gives the
// top node's chaining value without ROOT, used below as a wrong answer.
const node = (bytes, at, len, counter, root) => {
  if (len <= 1024) return chunk(bytes, at, len, counter, root)
  const chunks = Math.ceil(len / 1024)
  let left = 1
  while (left * 2 < chunks) left *= 2
  const l = node(bytes, at, left * 1024, counter, false)
  const r = node(bytes, at + left * 1024, len - left * 1024, counter + left, false)
  return compress(IV, [...l, ...r], 0, 64, PARENT | (root ? ROOT : 0))
}
const toBytes = (cv) => { const out = Buffer.alloc(32); cv.forEach((x, i) => out.writeUInt32LE(x, i * 4)); return out }
const blake3 = (bytes, root = true) => toBytes(node(bytes, 0, bytes.length, 0, root))
const vectorInput = (length) => { const b = Buffer.alloc(length); for (let k = 0; k < length; k++) b[k] = k % 251; return b }
const vectors = {
  0: 'af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262',
  1: '2d3adedff11b61f14c886e35afa036736dcd87a74d27b5c1510225d0f592e213',
  2: '7b7015bb92cf0b318037702a6cdd81dee41224f734684c2c122cd6359cb1ee63',
  3: 'e1be4d7a8ab5560aa4199eea339849ba8e293d55ca0a81006726d184519e647f',
  4: 'f30f5ab28fe047904037f77b6da4fea1e27241c5d132638d8bedce9d40494f32',
  5: 'b40b44dfd97e7a84a996a91af8b85188c66c126940ba7aad2e7ae6b385402aa2',
  6: '06c4e8ffb6872fad96f9aaca5eee1553eb62aed0ad7198cef42e87f6a616c844',
  7: '3f8770f387faad08faa9d8414e9f449ac68e6ff0417f673f602a646a891419fe',
  8: '2351207d04fc16ade43ccab08600939c7c1fa70a5c0aaca76063d04c3228eaeb',
  63: 'e9bc37a594daad83be9470df7f7b3798297c3d834ce80ba85d6e207627b7db7b',
  64: '4eed7141ea4a5cd4b788606bd23f46e212af9cacebacdc7d1f4c6dc7f2511b98',
  65: 'de1e5fa0be70df6d2be8fffd0e99ceaa8eb6e8c93a63f2d8d1c30ecb6b263dee',
  127: 'd81293fda863f008c09e92fc382a81f5a0b4a1251cba1634016a0f86a6bd640d',
  128: 'f17e570564b26578c33bb7f44643f539624b05df1a76c81f30acd548c44b45ef',
  129: '683aaae9f3c5ba37eaaf072aed0f9e30bac0865137bae68b1fde4ca2aebdcb12',
  1023: '10108970eeda3eb932baac1428c7a2163b0e924c9a9e25b35bba72b28f70bd11',
  1024: '42214739f095a406f3fc83deb889744ac00df831c10daa55189b5d121c855af7',
  1025: 'd00278ae47eb27b34faecf67b4fe263f82d5412916c1ffd97c8cb7fb814b8444',
  2048: 'e776b6028c7cd22a4d0ba182a8bf62205d2ef576467e838ed6f2529b85fba24a',
  2049: '5f4d72f40d7a5f82b15ca2b2e44b1de3c2ef86c426c95c1af0b6879522563030',
  3072: 'b98cb0ff3623be03326b373de6b9095218513e64f1ee2edd2525c7ad1e5cffd2',
  3073: '7124b49501012f81cc7f11ca069ec9226cecb8a2c850cfe644e327d22d3e1cd3',
  4096: '015094013f57a5277b59d8475c0501042c0b642e531b0a1c8f58d2163229e969',
  4097: '9b4052b38f1c5fc8b1f9ff7ac7b27cd242487b3d890d15c96a1c25b8aa0fb995',
  5120: '9cadc15fed8b5d854562b26a9536d9707cadeda9b143978f319ab34230535833',
  5121: '628bd2cb2004694adaab7bbd778a25df25c47b9d4155a55f8fbd79f2fe154cff',
  6144: '3e2e5b74e048f3add6d21faab3f83aa44d3b2278afb83b80b3c35164ebeca205',
  6145: 'f1323a8631446cc50536a9f705ee5cb619424d46887f3c376c695b70e0f0507f',
  7168: '61da957ec2499a95d6b8023e2b0e604ec7f6b50e80a9678b89d2628e99ada77a',
  7169: 'a003fc7a51754a9b3c7fae0367ab3d782dccf28855a03d435f8cfe74605e7817',
  8192: 'aae792484c8efe4f19e2ca7d371d8c467ffb10748d8a5a1ae579948f718a2a63',
  8193: 'bab6c09cb8ce8cf459261398d2e7aef35700bf488116ceb94a36d0f5f1b7bc3b',
  16384: 'f875d6646de28985646f34ee13be9a576fd515f76b5b0a26bb324735041ddde4',
  31744: '62b6960e1a44bcc1eb1a611a8d6235b6b4b78f32e7abc4fb4c6cdcce94895c47',
  102400: 'bc3e3d41a1146b069abffad3c0d44860cf664390afce4d9661f7902e7943e085',
}
for (const [length, hex] of Object.entries(vectors)) assert.equal(blake3(vectorInput(Number(length))).toString('hex'), hex, `official vector, input_len ${length}`)
assert.equal(blake3(Buffer.from('abc')).toString('hex'), '6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85')
// Message bytes for the other fixtures, built deterministically: xorshift32
// noise, ASCII log text, a 0..255 ramp, zeros and 0xff runs, in turn (made
// the same way as in sha1-messages and blake2b-512).
const logWords = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'request', 'user', 'session', 'GET', 'POST']
const fill = (i, length) => {
  const out = Buffer.alloc(length)
  const kind = i % 5
  if (kind === 0) {
    let x = (i + 1) * 2654435761 >>> 0 || 1
    for (let k = 0; k < length; k++) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; out[k] = x & 0xff }
  } else if (kind === 1) {
    let s = ''
    for (let j = 0; s.length < length; j++) s += `2026-10-09T08:${String(j % 60).padStart(2, '0')}:00Z ${logWords[(i + j) % logWords.length]} id=${i * 7919 + j} status=${200 + (j % 5)}\n`
    out.write(s.slice(0, length), 'latin1')
  } else if (kind === 2) {
    for (let k = 0; k < length; k++) out[k] = (k + i) & 0xff
  } else if (kind === 4) {
    out.fill(0xff)
  }
  return out
}
// Fixtures 0..17 are official vector inputs (bytes i % 251) at lengths that
// cross the 64-byte block, the 1024-byte chunk and the first tree levels
// (2, 3, 4, 6, 8, 9, 16 and 100 chunks). Fixture 18 is "abc". The rest
// grow from a few bytes to 4 MiB, on and just past powers of two in chunks
// (the tree is complete exactly at 2^k chunks; one byte more adds a level).
const vectorLengths = [0, 1, 3, 64, 65, 1023, 1024, 1025, 2048, 2049, 3072, 3073, 4096, 5121, 8192, 8193, 16384, 102400]
const generatedLengths = [31, 32, 33, 127, 1000, 1500, 4095, 10000, 32768, 32769, 65536, 65537, 100000, 131072, 200000, 262144, 262145, 524288, 1048575, 1048576, 4194304]
const messages = [
  ...vectorLengths.map(vectorInput),
  Buffer.from('abc'),
  ...generatedLengths.map((length, j) => fill(j, length)),
]
// An input is the message as a lowercase hex string (fixtures are shared as
// JSON); each adapter's prepare turns it into bytes once, before any timing.
export const cases = messages.map((bytes) => ({ input: bytes.toString('hex'), expected: Array.from(blake3(bytes)) }))
for (const [i, length] of vectorLengths.entries()) assert.equal(Buffer.from(cases[i].expected).toString('hex'), vectors[length], `fixture ${i} is the official vector`)
const bytesOf = (x) => {
  if (x instanceof ArrayBuffer) return Array.from(new Uint8Array(x))
  if (ArrayBuffer.isView(x)) return Array.from(new Uint8Array(x.buffer, x.byteOffset, x.byteLength))
  if (Array.isArray(x)) return x
  if (x && x.type === 'Buffer' && Array.isArray(x.data)) return x.data
  // A Go []byte is marshalled by encoding/json as base64.
  if (typeof x === 'string' && /^[A-Za-z0-9+/]{43}=$/.test(x)) return Array.from(Buffer.from(x, 'base64'))
  assert.fail('32 digest bytes required')
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
// to 31 bytes, the 64-byte extended output (XOF) of the same message, another
// fixture's digest, the digest as hex text, the top chaining value without
// the ROOT flag, the official keyed_hash and derive_key of the same input,
// and two other 32-byte digests of the same bytes (SHA-256, BLAKE2s-256).
const flipped = [...cases[6].expected]; flipped[31] ^= 1
assert.throws(() => verifyOne(6, flipped), /fixture 6/)
assert.throws(() => verifyOne(6, cases[6].expected.slice(0, 31)), /fixture 6/)
assert.throws(() => verifyOne(6, Buffer.from('42214739f095a406f3fc83deb889744ac00df831c10daa55189b5d121c855af71cf8107265ecdaf8505b95d8fcec83a98a6a96ea5109d2c179c47a387ffbb404', 'hex')), /fixture 6/)
assert.throws(() => verifyOne(7, cases[6].expected), /fixture 7/)
assert.throws(() => verifyOne(6, Buffer.from(cases[6].expected).toString('hex')))
assert.throws(() => verifyOne(8, blake3(messages[8], false)), /fixture 8/)
assert.throws(() => verifyOne(6, Buffer.from('75c46f6f3d9eb4f55ecaaee480db732e6c2105546f1e675003687c31719c7ba4', 'hex')), /fixture 6/)
assert.throws(() => verifyOne(6, Buffer.from('7356cd7720d5b66b6d0697eb3177d9f8d73a4a5c5e968896eb6a689684302706', 'hex')), /fixture 6/)
assert.throws(() => verifyOne(18, createHash('sha256').update('abc').digest()), /fixture 18/)
assert.throws(() => verifyOne(18, createHash('blake2s256').update('abc').digest()), /fixture 18/)
// The base64 form a Go []byte takes is accepted only when it holds the digest.
verifyOne(18, Buffer.from(cases[18].expected).toString('base64'))
assert.throws(() => verifyOne(6, Buffer.from(flipped).toString('base64')), /fixture 6/)
