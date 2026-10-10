import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { deflateSync } from 'node:zlib'
// Deterministic baseline TIFF files (8-bit RGB and RGBA, chunky, in strips), written by the scenario
// itself: uncompressed, LZW and Deflate, with and without the horizontal predictor, in both byte orders.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296

// TIFF LZW (TIFF 6.0 section 13): codes most significant bit first, a Clear code first, the code width
// growing one code early (as libtiff writes it), a Clear before the table would pass 4094 entries.
const lzw = (data) => {
  const out = []
  let acc = 0, bits = 0, width = 9, next = 258, dict = new Map()
  const emit = (code) => {
    acc = (acc << width) | code; bits += width
    while (bits >= 8) { bits -= 8; out.push((acc >>> bits) & 255) }
    acc &= (1 << bits) - 1
  }
  const grow = () => { next++; if (next === 1 << width && width < 12) width++ }
  emit(256)
  let w = data[0]
  for (let i = 1; i < data.length; i++) {
    const c = data[i], key = w * 256 + c, hit = dict.get(key)
    if (hit !== undefined) { w = hit; continue }
    emit(w); dict.set(key, next); grow()
    if (next === 4094) { emit(256); dict = new Map(); next = 258; width = 9 }
    w = c
  }
  emit(w); grow(); emit(257)
  if (bits > 0) out.push((acc << (8 - bits)) & 255)
  return Buffer.from(out)
}
// Horizontal differencing (TIFF 6.0 section 14), sample by sample within each row.
const differenced = (rows, w, spp) => {
  const out = Buffer.from(rows), stride = w * spp
  for (let r = 0; r < out.length / stride; r++) for (let i = stride - 1; i >= spp; i--) out[r * stride + i] = (out[r * stride + i] - out[r * stride + i - spp]) & 255
  return out
}
const COMPRESSION = { none: 1, lzw: 5, deflate: 8 }
const encodeTiff = (px, w, h, spp, { compression, predictor, rowsPerStrip, bigEndian }) => {
  const stride = w * spp, strips = []
  for (let y = 0; y < h; y += rowsPerStrip) {
    let rows = px.subarray(y * stride, Math.min(h, y + rowsPerStrip) * stride)
    if (predictor) rows = differenced(rows, w, spp)
    strips.push(compression === 'lzw' ? lzw(rows) : compression === 'deflate' ? deflateSync(rows, { level: 6 }) : Buffer.from(rows))
  }
  // Layout: header, strips (each at an even offset), then the IFD and the values that do not fit in it.
  const u16 = (v) => { const b = Buffer.alloc(2); bigEndian ? b.writeUInt16BE(v) : b.writeUInt16LE(v); return b }
  const u32 = (v) => { const b = Buffer.alloc(4); bigEndian ? b.writeUInt32BE(v) : b.writeUInt32LE(v); return b }
  const parts = [Buffer.from(bigEndian ? 'MM' : 'II', 'latin1'), u16(42), u32(0)]
  let offset = 8
  const stripOffsets = []
  for (const s of strips) {
    stripOffsets.push(offset); parts.push(s); offset += s.length
    if (offset % 2) { parts.push(Buffer.alloc(1)); offset++ }
  }
  const SHORT = 3, LONG = 4, RATIONAL = 5
  const tags = [
    [256, LONG, [w]], [257, LONG, [h]], [258, SHORT, Array(spp).fill(8)], [259, SHORT, [COMPRESSION[compression]]],
    [262, SHORT, [2]], [273, LONG, stripOffsets], [277, SHORT, [spp]], [278, LONG, [rowsPerStrip]],
    [279, LONG, strips.map((s) => s.length)], [282, RATIONAL, [72, 1]], [283, RATIONAL, [72, 1]], [284, SHORT, [1]], [296, SHORT, [2]],
  ]
  if (predictor) tags.push([317, SHORT, [2]])
  if (spp === 4) tags.push([338, SHORT, [2]]) // unassociated alpha
  const ifdOffset = offset, ifdSize = 2 + tags.length * 12 + 4
  const ifd = [u16(tags.length)], extra = []
  let extraOffset = ifdOffset + ifdSize
  for (const [tag, type, values] of tags) {
    const bytes = Buffer.concat(values.map(type === SHORT ? u16 : u32))
    const count = type === RATIONAL ? values.length / 2 : values.length
    ifd.push(u16(tag), u16(type), u32(count))
    if (bytes.length <= 4) ifd.push(Buffer.concat([bytes, Buffer.alloc(4 - bytes.length)]))
    else { ifd.push(u32(extraOffset)); extra.push(bytes); extraOffset += bytes.length }
  }
  ifd.push(u32(0))
  parts[2] = u32(ifdOffset)
  return Buffer.concat([...parts, ...ifd, ...extra])
}

const painters = [
  // smooth two-axis gradient
  (w, h) => (x, y) => [x * 255 / w, y * 255 / h, (x + y) & 255, 255],
  // large flat blocks, four colours
  (w, h) => (x, y) => [[200, 30, 30, 255], [30, 160, 60, 255], [30, 60, 200, 255], [240, 220, 40, 255]][(x * 4 / w | 0) % 2 + 2 * ((y * 4 / h | 0) % 2)],
  // 8 pixel checkerboard
  () => (x, y) => ((x >> 3) + (y >> 3)) & 1 ? [250, 250, 250, 255] : [20, 20, 20, 255],
  // concentric rings
  (w, h) => (x, y) => { const dx = x - w / 2, dy = y - h / 2, d = Math.sqrt(dx * dx + dy * dy); return [(d * 6) & 255, (d * 3) & 255, 128 + (d & 63), 255] },
  // photographic stand-in: smooth waves plus fine noise
  (w, h, r) => (x, y) => { const n = () => (r() * 24) | 0; return [128 + 100 * Math.sin(x / 17 + y / 41) + n(), 128 + 100 * Math.sin(x / 29 - y / 23) + n(), 128 + 100 * Math.cos(y / 19) + n(), 255] },
  // full-range noise (incompressible), small only
  (w, h, r) => () => [r() * 256, r() * 256, r() * 256, 255],
  // alpha ramp over a stripe pattern
  (w, h) => (x, y) => [(x >> 2) % 2 ? 255 : 0, (y >> 2) % 2 ? 255 : 0, 90, (x * 255 / w) | 0],
  // sprite: transparent background with opaque and half-transparent shapes
  (w, h) => (x, y) => { const dx = x - w / 2, dy = y - h / 2; return dx * dx + dy * dy < w * h / 9 ? [220, 120, 20, 255] : Math.abs(dx) < w / 3 && Math.abs(dy) < h / 3 ? [20, 120, 220, 128] : [0, 0, 0, 0] },
  // horizontal bands with noise rows, uneven alpha
  (w, h, r) => (x, y) => y % 16 < 12 ? [60 + (y >> 4) * 9 & 255, 90, 160, 255 - (y & 63)] : [r() * 256, r() * 256, 40, r() * 256],
]
const sizes = [[64, 64], [128, 96], [200, 150], [256, 256], [320, 240], [400, 300], [160, 160], [96, 128], [512, 128], [100, 300], [131, 77]]
const render = (i, w, h, spp) => {
  const r = rng(91 + i), paint = painters[i % painters.length](w, h, r), px = Buffer.alloc(w * h * spp)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = paint(x, y); for (let k = 0; k < spp; k++) px[(y * w + x) * spp + k] = p[k] }
  return px
}
// Five ways to store the pixels: uncompressed, LZW and Deflate, the last two also with the predictor.
const storage = [['none', false], ['lzw', false], ['lzw', true], ['deflate', false], ['deflate', true]]
const stripRows = [1, 8, 16, 64, 0] // 0: the whole image in one strip
const fixtures = []
for (let i = 0; i < 40; i++) {
  let [w, h] = sizes[(i * 7 + (i >> 3)) % sizes.length]
  if (i % painters.length === 5) { w = Math.min(w, 128); h = Math.min(h, 96) }
  const spp = i % 3 === 0 ? 3 : 4, [compression, predictor] = storage[i % storage.length], rows = stripRows[(i + (i / 5 | 0)) % stripRows.length]
  const px = render(i, w, h, spp)
  fixtures.push({ width: w, height: h, spp, predictor, data: px, file: encodeTiff(px, w, h, spp, { compression, predictor, rowsPerStrip: rows || h, bigEndian: i % 4 === 3 }) })
}
// Smallest images: one pixel and 17 by 9, RGB and RGBA, LZW with the predictor and uncompressed big-endian.
for (const [w, h, spp, compression, bigEndian] of [[1, 1, 3, 'lzw', false], [1, 1, 4, 'none', true], [17, 9, 3, 'none', true], [17, 9, 4, 'lzw', false]]) {
  const px = render(7, w, h, spp), predictor = compression === 'lzw'
  fixtures.push({ width: w, height: h, spp, predictor, data: px, file: encodeTiff(px, w, h, spp, { compression, predictor, rowsPerStrip: 4, bigEndian }) })
}
// An input is the TIFF file as a lowercase hex string; each adapter turns it into bytes in its untimed prepare step.
export const cases = fixtures.map(({ file }) => ({ input: file.toString('hex') }))

const bytesOf = (data) => typeof data === 'string' ? Buffer.from(data, 'base64') : Buffer.from(data.buffer, data.byteOffset, data.byteLength)
// An output is { width, height, data }: data holds the pixels row by row, as a byte array or a base64 string
// (Go marshals []byte as base64; the Rust, Python and Go runners encode outside timing). An RGBA file
// must give width * height * 4 bytes; an RGB file width * height * 3, or * 4 with every alpha 255.
export const verifyOne = (i, out) => {
  const { width, height, spp, data } = fixtures[i]
  assert.ok(out && typeof out === 'object', `fixture ${i}: object output required`)
  assert.equal(out.width, width, `fixture ${i}: width`)
  assert.equal(out.height, height, `fixture ${i}: height`)
  const got = bytesOf(out.data), n = width * height, channels = got.length / n
  assert.ok(channels === 4 || (spp === 3 && channels === 3), `fixture ${i}: ${got.length} bytes is not ${spp === 3 ? 'RGB or RGBA' : 'RGBA'} for ${width} by ${height}`)
  if (channels === spp) { assert.ok(got.equals(data), `fixture ${i}: pixels differ from the generator's`); return }
  for (let p = 0; p < n; p++) {
    for (let k = 0; k < 3; k++) assert.equal(got[p * 4 + k], data[p * 3 + k], `fixture ${i}: pixel ${p} differs from the generator's`)
    assert.equal(got[p * 4 + 3], 255, `fixture ${i}: pixel ${p} of an RGB file must be opaque`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.data.length

// Proof that the check refuses decoders that did not do the job: red and blue swapped, the alpha
// channel dropped, the predictor not undone, the rows upside down, the last strip left empty,
// alpha premultiplied, and a buffer of the right size that was never filled.
const wrongOutputs = (i) => {
  const { width: w, height: h, spp, data } = fixtures[i], n = w * h
  const map = (f) => { const out = Buffer.from(data); for (let p = 0; p < n; p++) f(out, p * spp); return out }
  const flipped = Buffer.alloc(data.length), stride = w * spp
  for (let y = 0; y < h; y++) data.copy(flipped, (h - 1 - y) * stride, y * stride, (y + 1) * stride)
  const lastStripEmpty = Buffer.from(data); lastStripEmpty.fill(0, Math.max(0, data.length - stride * 4))
  const wrong = {
    'red and blue swapped': map((o, q) => { o[q] = data[q + 2]; o[q + 2] = data[q] }),
    'rows upside down': flipped,
    'last strip empty': lastStripEmpty,
    'never filled': Buffer.alloc(data.length),
  }
  if (spp === 4) {
    const rgb = Buffer.alloc(n * 3)
    for (let p = 0; p < n; p++) data.copy(rgb, p * 3, p * 4, p * 4 + 3)
    wrong['alpha dropped'] = rgb
    wrong['alpha premultiplied'] = map((o, q) => { for (let k = 0; k < 3; k++) o[q + k] = Math.round(data[q + k] * data[q + 3] / 255) })
  }
  if (fixtures[i].predictor) wrong['predictor not undone'] = differenced(data, w, spp)
  // A mistake that happens to give the right pixels on this picture is no proof; keep the others.
  return Object.fromEntries(Object.entries(wrong).filter(([, out]) => !out.equals(data)))
}
const refused = new Set()
for (const i of [2, 4, 7, 8, 9]) {
  const { width, height, predictor, spp } = fixtures[i]
  verifyOne(i, { width, height, data: fixtures[i].data })
  if (spp === 3) { const rgba = Buffer.alloc(width * height * 4, 255); for (let p = 0; p < width * height; p++) fixtures[i].data.copy(rgba, p * 4, p * 3, p * 3 + 3); verifyOne(i, { width, height, data: rgba }) }
  for (const [what, data] of Object.entries(wrongOutputs(i))) {
    assert.throws(() => verifyOne(i, { width, height, data }), undefined, `the check must refuse a decoder that gives ${what} (fixture ${i}${predictor ? ', predictor' : ''})`)
    refused.add(what)
  }
}
assert.equal(refused.size, 7, `every mistake must be shown refused on some fixture; shown: ${[...refused].join(', ')}`)
