import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const words = 'the of and to in is that for it as was with be by on not he this are or his from at which but have an had they you were their one all we can her has there been if more when will would who so no'.split(' ')
const prose = (r, n) => Array.from({ length: n }, () => words[Math.floor(r() * words.length)]).join(' ')
const hex = (r, n) => Array.from({ length: n }, () => Math.floor(r() * 256).toString(16).padStart(2, '0')).join('')
const b64 = (r, n) => { const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; return Array.from({ length: n }, () => a[Math.floor(r() * 64)]).join('') }
const jsonRecords = (r, n) => JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: i, name: `user-${Math.floor(r() * 1000)}`, email: `u${i}@example.com`, active: r() < 0.5, score: Math.round(r() * 10000) / 100, tags: ['a', 'b', 'c'].slice(0, 1 + Math.floor(r() * 3)) })))
const logLines = (r, n) => Array.from({ length: n }, (_, i) => `2026-10-06T12:${String(i % 60).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}Z INFO request id=${Math.floor(r() * 1e6)} path=/api/v1/items/${Math.floor(r() * 500)} status=${[200, 200, 200, 404, 500][Math.floor(r() * 5)]} ms=${Math.floor(r() * 300)}`).join('\n')
const csv = (r, n) => ['id,city,temp,humidity'].concat(Array.from({ length: n }, (_, i) => `${i},${['Lisbon', 'São Paulo', 'Tokyo', 'Oslo'][Math.floor(r() * 4)]},${(r() * 40 - 5).toFixed(1)},${Math.floor(r() * 100)}`)).join('\n')
const code = (n) => Array.from({ length: n }, (_, i) => `export function handler${i}(req, res) {\n  const value = req.params.id${i};\n  if (!value) { return res.status(400).send('missing'); }\n  return res.json({ id: value, ok: true });\n}\n`).join('\n')
const html = (r, n) => `<!doctype html><html><body>${Array.from({ length: n }, (_, i) => `<div class="item item-${i % 4}"><h2>Title ${i}</h2><p>${prose(r, 12)}</p><a href="/items/${i}">more</a></div>`).join('\n')}</body></html>`
const unicode = (r, n) => Array.from({ length: n }, () => ['café', '日本語のテキスト', 'Привет мир', 'naïve résumé', '😀 emoji'][Math.floor(r() * 5)]).join(' ')
const kinds = [
  (r, n) => prose(r, n * 4), (r, n) => jsonRecords(r, n), (r, n) => logLines(r, n), (r, n) => csv(r, n * 2),
  (r, n) => code(n), (r, n) => html(r, n), (r, n) => unicode(r, n * 3), (r, n) => b64(r, n * 24), (r, n) => hex(r, n * 12),
  (r, n) => 'a'.repeat(n * 40), (r, n) => 'abcd'.repeat(n * 10) + prose(r, n),
]
const sizes = [6, 16, 40, 90]
export const cases = []
for (let i = 0; i < 36; i++) {
  const r = rng(1000 + i)
  const input = kinds[i % kinds.length](r, sizes[Math.floor(i / kinds.length) % sizes.length] + (i % 3))
  cases.push({ input, expected: input })
}
cases.push({ input: '', expected: '' }, { input: 'x', expected: 'x' }, { input: 'Hello, compression!', expected: 'Hello, compression!' }, { input: unicode(rng(7), 400), expected: unicode(rng(7), 400) })

// The scenario's own decoder for the raw Snappy block format (google/snappy format_description.txt):
// a little-endian base-128 varint with the uncompressed length, then elements, each a tag byte whose low
// two bits give the kind. 00 literal: length-1 in the upper six bits, or 60..63 for a length-1 in the
// next 1..4 bytes. 01 copy: length 4..11 from bits 2..4, an 11-bit offset from bits 5..7 and one byte.
// 10 copy: length 1..64 from the upper six bits, a 2-byte offset. 11 copy: the same with a 4-byte offset.
// Strict: an offset of 0 or past what has been written, an element that runs past the declared length or
// the end of the input, trailing bytes and a length short of the declared one are all refused. So the
// framing format ("sNaPpY" chunks), a length prefix of another size or a private format fails here.
export const decodeSnappy = (src) => {
  let pos = 0, length = 0, shift = 0
  for (;;) {
    assert.ok(pos < src.length, 'snappy: truncated length varint')
    const b = src[pos++]
    assert.ok(shift < 32 && (shift < 28 || b < 16), 'snappy: length varint exceeds 32 bits')
    length += (b & 0x7f) * 2 ** shift
    if (b < 0x80) break
    shift += 7
  }
  const out = new Uint8Array(length)
  let o = 0
  const need = (n) => assert.ok(pos + n <= src.length, 'snappy: element runs past the end of the input')
  while (pos < src.length) {
    const tag = src[pos++]
    if ((tag & 3) === 0) {
      let len = tag >> 2
      if (len >= 60) {
        const extra = len - 59
        need(extra)
        len = 0
        for (let k = 0; k < extra; k++) len += src[pos + k] * 2 ** (8 * k)
        pos += extra
      }
      len += 1
      need(len)
      assert.ok(o + len <= length, 'snappy: literal runs past the declared length')
      out.set(src.subarray(pos, pos + len), o)
      pos += len
      o += len
      continue
    }
    let len, offset
    if ((tag & 3) === 1) {
      need(1)
      len = 4 + ((tag >> 2) & 7)
      offset = ((tag >> 5) << 8) | src[pos++]
    } else if ((tag & 3) === 2) {
      need(2)
      len = 1 + (tag >> 2)
      offset = src[pos] | (src[pos + 1] << 8)
      pos += 2
    } else {
      need(4)
      len = 1 + (tag >> 2)
      offset = (src[pos] | (src[pos + 1] << 8) | (src[pos + 2] << 16)) + src[pos + 3] * 2 ** 24
      pos += 4
    }
    assert.ok(offset > 0 && offset <= o, `snappy: copy offset ${offset} with ${o} bytes written`)
    assert.ok(o + len <= length, 'snappy: copy runs past the declared length')
    for (let k = 0; k < len; k++, o++) out[o] = out[o - offset]
  }
  assert.equal(o, length, 'snappy: fewer bytes than the declared length')
  return out
}

// Hand-written streams for each element kind, checked when the scenario loads.
const lit = (s) => [...Buffer.from(s, 'latin1')]
const vectors = [
  // literal 'abc', then a 1-byte-offset copy of 9 bytes at offset 3 that overlaps itself
  [[0x0c, 0x08, ...lit('abc'), 0x15, 0x03], 'abcabcabcabc'],
  // literal, a 2-byte-offset copy of 11 bytes at offset 13, a one-byte literal
  [[0x19, 0x30, ...lit('hello world, '), 0x2a, 0x0d, 0x00, 0x00, ...lit('!')], 'hello world, hello world!'],
  // a 4-byte-offset copy
  [[0x08, 0x0c, ...lit('abcd'), 0x0f, 0x04, 0x00, 0x00, 0x00], 'abcdabcd'],
  // a two-byte varint (300) and run-length copies at offset 1
  [[0xac, 0x02, 0x00, ...lit('a'), 0xfe, 1, 0, 0xfe, 1, 0, 0xfe, 1, 0, 0xfe, 1, 0, 0xaa, 1, 0], 'a'.repeat(300)],
  // a literal of 70 bytes with its length in one extra byte (tag 60)
  [[0x46, 0xf0, 69, ...lit('0123456789'.repeat(7))], '0123456789'.repeat(7)],
  // the empty input
  [[0x00], ''],
]
for (const [stream, text] of vectors) assert.equal(Buffer.from(decodeSnappy(Uint8Array.from(stream))).toString('latin1'), text)
const malformed = [
  [0x03, 0x00, 0x61, 0x05, 0x00], // copy with offset 0
  [0x0c, 0x08, ...lit('abc'), 0x15, 0x04], // copy offset past what was written
  [0x05, 0x08, ...lit('abc')], // fewer bytes than declared
  [0x02, 0x08, ...lit('abc')], // literal past the declared length
  [0x03, 0x08, ...lit('abc'), 0x00], // trailing byte
  [0x05, 0x10, ...lit('ab')], // literal past the end of the input
  [0xff, 0x06, 0x00, 0x00, ...lit('sNaPpY')], // the framing format's stream identifier
  [0xff, 0xff, 0xff, 0xff, 0xff, 0x01], // varint over 32 bits
]
for (const stream of malformed) assert.throws(() => decodeSnappy(Uint8Array.from(stream)))

// Every output is { compressed, text }: the raw Snappy block the timed call produced and the text it
// restored from it. JavaScript gives the bytes as a Uint8Array; Rust, Go and Python give them as base64
// text in what goes to the verifier (Go's encoding/json does that for a []byte by itself).
// Snappy has no entropy coding, so as in the LZ4 task the random base64 and hex fixtures need not shrink;
// every other fixture above MIN_BYTES must. No block may exceed Snappy's own bound, 32 + n + n/6.
const MIN_BYTES = 300
const utf8 = new TextEncoder()
const inputs = cases.map(({ input }) => utf8.encode(input))
const isRandom = (i) => i < 36 && (i % kinds.length === 7 || i % kinds.length === 8)
const mustShrink = cases.map((_, i) => inputs[i].length > MIN_BYTES && !isRandom(i))
const toBytes = (i, compressed) => {
  if (compressed instanceof Uint8Array) return compressed
  assert.equal(typeof compressed, 'string', `fixture ${i}: compressed must be bytes (base64 text from a native adapter)`)
  const bytes = Buffer.from(compressed, 'base64')
  assert.equal(bytes.toString('base64'), compressed, `fixture ${i}: compressed is not canonical base64`)
  return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.length)
}
export const verifyOne = (i, output) => {
  const { expected } = cases[i], n = inputs[i].length
  assert.ok(output !== null && typeof output === 'object', `fixture ${i}: { compressed, text } output required`)
  assert.equal(typeof output.text, 'string', `fixture ${i}: text must be a string`)
  assert.equal(output.text, expected, `fixture ${i}: restored text differs from the input`)
  const bytes = toBytes(i, output.compressed)
  assert.ok(bytes.length <= 32 + n + Math.floor(n / 6), `fixture ${i}: ${bytes.length} bytes exceeds Snappy's bound for ${n}`)
  const decoded = decodeSnappy(bytes)
  assert.ok(Buffer.from(decoded).equals(Buffer.from(inputs[i])), `fixture ${i}: the compressed block does not decode to the input`)
  if (mustShrink[i]) assert.ok(bytes.length < n, `fixture ${i}: compressed to ${bytes.length} bytes, input is ${n}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.text.length + value.compressed.length

// The check refuses wrong outputs. A valid block of literals only (what a copying "compressor" writes)
// decodes, so it passes where nothing has to shrink and fails where something does; the input bytes
// themselves, another fixture's block, a block with a 4-byte length prefix and a wrong text all fail.
const varint = (n) => { const out = []; while (n >= 0x80) { out.push((n & 0x7f) | 0x80); n = Math.floor(n / 128) } out.push(n); return out }
const literalsOnly = (bytes) => {
  const out = varint(bytes.length)
  for (let p = 0; p < bytes.length; p += 65536) {
    const chunk = bytes.subarray(p, p + 65536), m = chunk.length - 1
    if (m < 60) out.push(m << 2)
    else if (m < 256) out.push(60 << 2, m)
    else out.push(61 << 2, m & 0xff, m >> 8)
    out.push(...chunk)
  }
  return Uint8Array.from(out)
}
const big = mustShrink.indexOf(true), small = cases.findIndex(({ input }) => input === 'Hello, compression!')
assert.ok(big >= 0 && small >= 0)
verifyOne(small, { compressed: literalsOnly(inputs[small]), text: cases[small].input })
verifyOne(small, { compressed: Buffer.from(literalsOnly(inputs[small])).toString('base64'), text: cases[small].input })
assert.throws(() => verifyOne(big, { compressed: literalsOnly(inputs[big]), text: cases[big].input }))
assert.throws(() => verifyOne(small, { compressed: inputs[small], text: cases[small].input }))
assert.throws(() => verifyOne(small, { compressed: literalsOnly(inputs[small + 1]), text: cases[small].input }))
assert.throws(() => verifyOne(small, { compressed: Uint8Array.from([...Buffer.alloc(4), ...literalsOnly(inputs[small]).subarray(1)]), text: cases[small].input }))
assert.throws(() => verifyOne(small, { compressed: literalsOnly(inputs[small]), text: cases[small].input.toUpperCase() }))
assert.throws(() => verifyOne(small, { compressed: literalsOnly(inputs[small]).toString(), text: cases[small].input }))
