import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const enc = new TextEncoder()
// Reference: the WHATWG UTF-8 decoding algorithm written out here (one U+FFFD
// per maximal invalid subpart, a leading U+FEFF kept), so that no entry is
// checked against itself.
const decode = (bytes) => {
  let out = '', cp = 0, need = 0, seen = 0, lo = 0x80, hi = 0xbf
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]
    if (need === 0) {
      if (b < 0x80) out += String.fromCharCode(b)
      else if (b >= 0xc2 && b <= 0xdf) { need = 1; cp = b & 0x1f }
      else if (b >= 0xe0 && b <= 0xef) { if (b === 0xe0) lo = 0xa0; if (b === 0xed) hi = 0x9f; need = 2; cp = b & 0x0f }
      else if (b >= 0xf0 && b <= 0xf4) { if (b === 0xf0) lo = 0x90; if (b === 0xf4) hi = 0x8f; need = 3; cp = b & 0x07 }
      else out += '\ufffd'
      continue
    }
    if (b < lo || b > hi) {
      // Not a continuation of this sequence: replace it and look at the byte again.
      cp = need = seen = 0; lo = 0x80; hi = 0xbf; out += '\ufffd'; i--
      continue
    }
    lo = 0x80; hi = 0xbf; cp = (cp << 6) | (b & 0x3f)
    if (++seen === need) { out += String.fromCodePoint(cp); cp = need = seen = 0 }
  }
  return need ? out + '\ufffd' : out
}
const words = ['alpha', 'request', 'user', 'session', 'café', 'naïve', 'São Paulo', 'Zürich', '日本語', '東京都', 'Привет', 'мир', 'γειά', '😀', '🚀', 'data']
const text = (r, bytes, mix) => {
  let s = ''
  while (enc.encode(s).length < bytes) {
    const k = Math.floor(r() * 100)
    s += k < mix[0] ? 'the quick brown fox jumps over the lazy dog ' : words[Math.floor(r() * words.length)] + (k % 3 ? ' ' : ', ')
  }
  return s
}
// Invalid byte sequences: truncated 2/3/4-byte lead, stray continuation, overlong,
// UTF-16 surrogate, beyond U+10FFFF, bytes that never occur, lead followed by ASCII.
const bad = [[0xc3], [0xe6, 0x97], [0xf0, 0x9f, 0x98], [0x80], [0xbf, 0xbf], [0xc0, 0x80], [0xe0, 0x80, 0x80],
  [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80], [0xf8, 0x88, 0x80, 0x80, 0x80], [0xff], [0xfe, 0xff], [0xe6, 0x41], [0xf0, 0x9f, 0x41]]
const withInvalid = (r, bytes, per) => {
  const out = []
  for (const b of bytes) {
    out.push(b)
    if (r() < per) out.push(...bad[Math.floor(r() * bad.length)])
  }
  return Uint8Array.from(out)
}
const hex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('')
const mixes = [[100], [60], [20], [0]] // share of plain ASCII prose
const sizes = [60, 200, 600, 1500, 4000, 12000]
const inputs = []
// 24 valid and 24 damaged (about 1 invalid sequence per 100 bytes) buffers.
for (let i = 0; i < 24; i++) {
  const r = rng(500 + i)
  const bytes = enc.encode(text(r, sizes[i % sizes.length], mixes[i % mixes.length]))
  inputs.push(bytes)
  inputs.push(withInvalid(rng(900 + i), bytes, 0.01))
}
// Edge cases.
inputs.push(new Uint8Array(0), Uint8Array.of(0x41), Uint8Array.of(0xff), Uint8Array.of(0xe6, 0x97), enc.encode('\u{FEFF}bom kept'),
  enc.encode('\u0000\u007f\u0080߿ࠀ￿\u{10000}\u{10ffff}'), Uint8Array.of(0x61, 0xf0, 0x9f, 0x98, 0x62), Uint8Array.of(0xed, 0xa0, 0x80, 0xed, 0xbf, 0xbf))
export const cases = inputs.map((bytes) => ({ input: hex(bytes), expected: decode(bytes) }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  let replaced = 0
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
    if (expected.includes('�')) replaced++
  }
  assert.ok(replaced > 20, 'fixtures must include invalid input')
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
