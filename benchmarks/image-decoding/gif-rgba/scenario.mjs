import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Deterministic single-frame GIF89a files, written by the scenario itself: global and local colour tables
// (and a global table that the local one overrides), a transparent index, interlaced and not.
// Everything is integer arithmetic, so Node, Bun and Deno write the same bytes.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296

// GIF LZW (GIF89a appendix F): codes least significant bit first, a Clear code first, the code width
// growing when the next code to assign reaches the width's limit (no early change), a Clear when the
// table is full (4096 codes), and the End code written at the width the decoder will read it with.
const lzw = (indices, minSize) => {
  const out = [], clear = 1 << minSize, end = clear + 1
  let acc = 0, bits = 0, size = minSize + 1, next = end + 1, dict = new Map()
  const emit = (code) => {
    acc |= code << bits; bits += size
    while (bits >= 8) { out.push(acc & 255); acc >>>= 8; bits -= 8 }
  }
  emit(clear)
  let w = indices[0]
  for (let i = 1; i < indices.length; i++) {
    const c = indices[i], key = w * 4096 + c, hit = dict.get(key)
    if (hit !== undefined) { w = hit; continue }
    emit(w)
    if (next === 4096) { emit(clear); dict = new Map(); next = end + 1; size = minSize + 1 }
    else { if (next >= 1 << size) size++; dict.set(key, next++) }
    w = c
  }
  emit(w)
  // The decoder adds an entry for the last code before it reads End, and may widen its codes for it.
  if (next === 1 << size && size < 12) size++
  emit(end)
  if (bits > 0) out.push(acc & 255)
  return Buffer.from(out)
}
const subBlocks = (data) => {
  const parts = []
  for (let o = 0; o < data.length; o += 255) { const n = Math.min(255, data.length - o); parts.push(Buffer.from([n]), data.subarray(o, o + n)) }
  parts.push(Buffer.from([0]))
  return Buffer.concat(parts)
}
// The smallest table size field (2^(field+1) entries) that holds n colours.
const tableBits = (n) => { let b = 1; while ((1 << b) < n) b++; return b }
const table = (palette, bits) => { const t = Buffer.alloc(3 << bits); palette.forEach((c, k) => t.set(c, k * 3)); return t }
// Interlaced row order (GIF89a appendix E): every 8th row from 0, every 8th from 4, every 4th from 2, every 2nd from 1.
const interlacedRows = (h) => { const rows = []; for (const [start, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let y = start; y < h; y += step) rows.push(y); return rows }
const u16 = (v) => Buffer.from([v & 255, v >> 8])
const encodeGif = (indices, w, h, palette, { tables, decoy, interlaced, transparent, control, comment }) => {
  const bits = tableBits(palette.length), minSize = Math.max(2, bits)
  const parts = [Buffer.from('GIF89a', 'latin1')]
  const globalPalette = tables === 'local' ? null : tables === 'both' ? decoy : palette
  const gBits = globalPalette ? tableBits(globalPalette.length) : 1
  parts.push(u16(w), u16(h), Buffer.from([(globalPalette ? 0x80 : 0) | (7 << 4) | (gBits - 1), 0, 0]))
  if (globalPalette) parts.push(table(globalPalette, gBits))
  if (comment) parts.push(Buffer.from([0x21, 0xfe]), subBlocks(Buffer.from(comment, 'latin1')))
  if (transparent !== null || control) parts.push(Buffer.from([0x21, 0xf9, 4, transparent !== null ? 1 : 0, 10, 0, transparent ?? 0, 0]))
  const local = tables !== 'global'
  parts.push(Buffer.from([0x2c]), u16(0), u16(0), u16(w), u16(h), Buffer.from([(local ? 0x80 | (bits - 1) : 0) | (interlaced ? 0x40 : 0)]))
  if (local) parts.push(table(palette, bits))
  let stored = indices
  if (interlaced) { stored = Buffer.alloc(indices.length); interlacedRows(h).forEach((y, k) => indices.copy(stored, k * w, y * w, (y + 1) * w)) }
  parts.push(Buffer.from([minSize]), subBlocks(lzw(stored, minSize)), Buffer.from([0x3b]))
  return Buffer.concat(parts)
}

// Palettes of 2 to 256 colours, from fixed formulas and seeds.
const randomPalette = (n, seed) => { const r = rng(seed); return Array.from({ length: n }, () => [r() * 256 | 0, r() * 256 | 0, r() * 256 | 0]) }
const cube = [...Array.from({ length: 216 }, (_, k) => [(k / 36 | 0) * 51, ((k / 6 | 0) % 6) * 51, (k % 6) * 51]), ...Array.from({ length: 40 }, (_, k) => [k * 6 + 8, k * 6 + 8, k * 6 + 8])]
const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const tri = (v, period) => { const p = ((v % period) + period) % period; return p < period / 2 ? p : period - p } // 0 .. period/2
// Each picture: a palette and a painter giving a palette index per pixel; `background` is the index a
// transparent picture leaves see-through.
const pictures = [
  // ordered-dither gradient over a 6x6x6 colour cube with greys (256 colours)
  { palette: cube, paint: (w, h) => (x, y) => { const d = bayer[(y & 3) * 4 + (x & 3)], q = (v, n) => Math.min(5, ((v * 5 * 16 / n) + d) >> 4); return q(x, w) * 36 + q(y, h) * 6 + q(x + y, w + h) } },
  // large flat blocks, four colours
  { palette: [[200, 30, 30], [30, 160, 60], [30, 60, 200], [240, 220, 40]], paint: (w, h) => (x, y) => (x * 4 / w | 0) % 2 + 2 * ((y * 4 / h | 0) % 2) },
  // 8 pixel checkerboard, two colours
  { palette: [[250, 250, 250], [20, 20, 20]], paint: () => (x, y) => ((x >> 3) + (y >> 3)) & 1 },
  // concentric rings, 16 colours
  { palette: randomPalette(16, 5), paint: (w, h) => (x, y) => { const dx = 2 * x - w, dy = 2 * y - h; return (Math.floor(Math.sqrt(dx * dx + dy * dy)) >> 3) & 15 } },
  // photographic stand-in: crossing waves with fine noise, 128 colours
  { palette: Array.from({ length: 128 }, (_, k) => [k * 2, 255 - k * 2, 64 + (k * 37 & 127)]), paint: (w, h, r) => (x, y) => (tri(x * 3 + y, 254) + tri(x - 2 * y, 170) * 3 / 4 + (r() * 12 | 0)) & 127 },
  // full-range noise (incompressible), 256 colours, small only
  { palette: randomPalette(256, 9), paint: (w, h, r) => () => r() * 256 | 0 },
  // sprite: a disc and a frame on a transparent background, 16 colours, background index 0
  { palette: randomPalette(16, 13), background: 0, paint: (w, h) => (x, y) => { const dx = 2 * x - w, dy = 2 * y - h; return dx * dx + dy * dy < w * h * 4 / 9 ? 1 + ((x + y) >> 3) % 7 : Math.abs(dx) < w * 2 / 3 && Math.abs(dy) < h * 2 / 3 && (Math.abs(dx) > w / 2 || Math.abs(dy) > h / 2) ? 9 + (y & 3) : 0 } },
  // line art: thin rules and dots on a transparent background, 8 colours (5 used), background the last index
  { palette: [[0, 0, 0], [200, 0, 0], [0, 120, 0], [0, 0, 180], [90, 90, 90], [0, 0, 0], [0, 0, 0], [255, 255, 255]], background: 7, paint: () => (x, y) => y % 12 === 0 ? 1 + (x >> 5) % 3 : x % 16 === 3 ? 4 : (x * 7 + y * 3) % 23 === 0 ? 0 : 7 },
  // horizontal bands with noise rows, 64 colours
  { palette: randomPalette(64, 21), paint: (w, h, r) => (x, y) => y % 16 < 12 ? (y >> 4) % 48 : 48 + (r() * 16 | 0) },
]
const sizes = [[64, 64], [128, 96], [200, 150], [256, 256], [320, 240], [400, 300], [160, 160], [96, 128], [512, 128], [100, 300], [131, 77]]
const TABLES = ['global', 'local', 'both']
const COMMENT = 'Written by the gif-rgba scenario; extensions before the image must be skipped.'
const fixtures = []
const add = (i, p, w, h, opts) => {
  const pic = pictures[p], r = rng(131 + i), paint = pic.paint(w, h, r), indices = Buffer.alloc(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) indices[y * w + x] = paint(x, y)
  // A transparent index of a picture without a background is the colour of its centre pixel.
  const transparent = pic.background ?? (opts.transparent ? indices[(h >> 1) * w + (w >> 1)] : null)
  // The transparent index's colour is black, so a see-through pixel is 0,0,0,0 whether the decoder
  // writes zero there (Go) or the table's colour with alpha 0 (the others).
  const palette = pic.palette.map((c, k) => k === transparent ? [0, 0, 0] : c)
  // The global table that a local one overrides: the same colours in reverse order.
  const decoy = [...palette].reverse()
  const file = encodeGif(indices, w, h, palette, { ...opts, decoy, transparent })
  const rgba = (pal, t) => { const out = Buffer.alloc(w * h * 4); for (let k = 0; k < w * h; k++) { const c = indices[k]; if (c !== t) { out.set(pal[c], k * 4); out[k * 4 + 3] = 255 } } return out }
  fixtures.push({ width: w, height: h, file, data: rgba(palette, transparent), transparent, interlaced: opts.interlaced, tables: opts.tables,
    viaDecoy: opts.tables === 'both' ? rgba([...decoy, ...Array(256).fill([0, 0, 0])], transparent) : null, indices })
}
for (let i = 0; i < 40; i++) {
  let [w, h] = sizes[(i * 7 + (i >> 3)) % sizes.length]
  const p = i % pictures.length
  if (p === 5) { w = Math.min(w, 128); h = Math.min(h, 96) }
  add(i, p, w, h, { tables: TABLES[i % 3], interlaced: (i >> 1) % 2 === 1, transparent: i % 5 === 2, control: i % 3 === 1, comment: i % 7 === 3 ? COMMENT : null })
}
// Smallest images: one pixel (opaque, and transparent), 17 by 9 and 3 by 5 interlaced (passes that hold
// no row or one row).
add(40, 2, 1, 1, { tables: 'global', interlaced: false, transparent: false, control: false, comment: null })
add(41, 6, 1, 1, { tables: 'local', interlaced: true, transparent: true, control: true, comment: null })
add(42, 3, 17, 9, { tables: 'both', interlaced: true, transparent: true, control: false, comment: COMMENT })
add(43, 7, 3, 5, { tables: 'global', interlaced: true, transparent: true, control: true, comment: null })
// An input is the GIF file as a lowercase hex string; each adapter turns it into bytes in its untimed prepare step.
export const cases = fixtures.map(({ file }) => ({ input: file.toString('hex') }))

const bytesOf = (data) => typeof data === 'string' ? Buffer.from(data, 'base64') : Buffer.from(data.buffer, data.byteOffset, data.byteLength)
// An output is { width, height, data }: data holds width * height * 4 bytes of RGBA, row by row, as a byte
// array or a base64 string (Go marshals []byte as base64; the Rust and Python runners encode outside timing).
export const verifyOne = (i, out) => {
  const { width, height, data } = fixtures[i]
  assert.ok(out && typeof out === 'object', `fixture ${i}: object output required`)
  assert.equal(out.width, width, `fixture ${i}: width`)
  assert.equal(out.height, height, `fixture ${i}: height`)
  const got = bytesOf(out.data)
  assert.equal(got.length, width * height * 4, `fixture ${i}: pixel buffer length`)
  assert.ok(got.equals(data), `fixture ${i}: pixels differ from the generator's`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.data.length

// Proof that the check refuses decoders that did not do the job: transparency ignored, the global table
// used where a local one overrides it, interlaced rows left in stored order, red and blue swapped, the
// rows upside down, palette indices returned as grey levels, and a buffer of the right size never filled.
const wrongOutputs = (i) => {
  const { width: w, height: h, data, transparent, interlaced, viaDecoy, indices } = fixtures[i], n = w * h, stride = w * 4
  const map = (f) => { const out = Buffer.from(data); for (let p = 0; p < n; p++) f(out, p * 4, p); return out }
  const flipped = Buffer.alloc(data.length)
  for (let y = 0; y < h; y++) data.copy(flipped, (h - 1 - y) * stride, y * stride, (y + 1) * stride)
  const wrong = {
    'red and blue swapped': map((o, q) => { o[q] = data[q + 2]; o[q + 2] = data[q] }),
    'rows upside down': flipped,
    'indices as grey levels': map((o, q, p) => { o[q] = o[q + 1] = o[q + 2] = indices[p]; o[q + 3] = 255 }),
    'never filled': Buffer.alloc(data.length),
  }
  if (transparent !== null) wrong['transparency ignored'] = map((o, q, p) => { if (indices[p] === transparent) o[q + 3] = 255 })
  if (viaDecoy) wrong['global table used'] = viaDecoy
  if (interlaced) { const stored = Buffer.alloc(data.length); interlacedRows(h).forEach((y, k) => data.copy(stored, k * stride, y * stride, (y + 1) * stride)); wrong['rows in stored order'] = stored }
  // A mistake that happens to give the right pixels on this picture is no proof; keep the others.
  return Object.fromEntries(Object.entries(wrong).filter(([, out]) => !out.equals(data)))
}
const refused = new Set()
for (const i of [2, 3, 6, 7, 12, 14]) {
  const { width, height } = fixtures[i]
  verifyOne(i, { width, height, data: fixtures[i].data })
  for (const [what, data] of Object.entries(wrongOutputs(i))) {
    assert.throws(() => verifyOne(i, { width, height, data }), undefined, `the check must refuse a decoder that gives ${what} (fixture ${i})`)
    refused.add(what)
  }
}
assert.equal(refused.size, 7, `every mistake must be shown refused on some fixture; shown: ${[...refused].join(', ')}`)
