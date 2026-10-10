import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Deterministic baseline JPEG files (quality 90, 4:4:4 and 4:2:0), written by the scenario
// from DCT coefficients it chose, and the picture each must decode to.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const zigzag = [0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63]
// The example tables of ITU T.81 Annex K, scaled to quality 90 as libjpeg does (factor 20%).
const baseLuma = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99]
const baseChroma = [17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99, ...Array(32).fill(99)]
const QUALITY = 90
const scaleTable = (t) => t.map((q) => Math.min(255, Math.max(1, Math.floor((q * (200 - 2 * QUALITY) + 50) / 100))))
const quant = [scaleTable(baseLuma), scaleTable(baseChroma)] // natural (row-major) order
// Huffman tables of Annex K.3: [code counts by length 1..16, symbols].
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const acRows = (first, ...rows) => [...first, ...rows.flatMap(([a, b]) => range(a, b))]
const huff = {
  dc0: [[0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], range(0, 11)],
  dc1: [[0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], range(0, 11)],
  ac0: [[0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d], acRows(
    [0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a],
    [0x16, 0x1a], [0x25, 0x2a], [0x34, 0x3a], [0x43, 0x4a], [0x53, 0x5a], [0x63, 0x6a], [0x73, 0x7a], [0x83, 0x8a], [0x92, 0x9a], [0xa2, 0xaa], [0xb2, 0xba], [0xc2, 0xca], [0xd2, 0xda], [0xe1, 0xea], [0xf1, 0xfa])],
  ac1: [[0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77], acRows(
    [0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71, 0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26, 0x27, 0x28, 0x29, 0x2a],
    [0x35, 0x3a], [0x43, 0x4a], [0x53, 0x5a], [0x63, 0x6a], [0x73, 0x7a], [0x82, 0x8a], [0x92, 0x9a], [0xa2, 0xaa], [0xb2, 0xba], [0xc2, 0xca], [0xd2, 0xda], [0xe2, 0xea], [0xf2, 0xfa])],
}
// Canonical codes (T.81 Annex C); every symbol the encoder can emit must have one.
const codes = {}
for (const [name, [counts, symbols]] of Object.entries(huff)) {
  assert.equal(counts.reduce((a, b) => a + b, 0), symbols.length, `${name}: counts and symbols disagree`)
  const table = new Map()
  let code = 0, k = 0
  for (let len = 1; len <= 16; len++) { for (let n = 0; n < counts[len - 1]; n++) table.set(symbols[k++], [code++, len]); code <<= 1 }
  const needed = name.startsWith('dc') ? range(0, 11) : [0x00, 0xf0, ...range(0, 15).flatMap((run) => range(1, 10).map((size) => (run << 4) | size))]
  for (const s of needed) assert.ok(table.has(s), `${name}: no code for symbol ${s}`)
  codes[name] = table
}
const C = (u) => (u === 0 ? Math.SQRT1_2 : 1)
// cos(k * pi / 16) for k = 0..8, written out so that every runtime uses the same values
// (engines may round Math.cos differently in the last place, which would change a coefficient).
const cos16 = [1, 0.9807852804032304, 0.9238795325112867, 0.8314696123025452, 0.7071067811865476, 0.5555702330196023, 0.38268343236508984, 0.19509032201612833, 0]
const cosOf = (k) => { k %= 32; return k <= 8 ? cos16[k] : k <= 16 ? -cos16[16 - k] : k <= 24 ? -cos16[k - 16] : cos16[32 - k] }
const cosTable = Array.from({ length: 64 }, (_, i) => cosOf((2 * (i >> 3) + 1) * (i & 7))) // [x * 8 + u]
const fdct = (block) => {
  const out = new Float64Array(64)
  for (let v = 0; v < 8; v++) for (let u = 0; u < 8; u++) {
    let s = 0
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) s += block[y * 8 + x] * cosTable[x * 8 + u] * cosTable[y * 8 + v]
    out[v * 8 + u] = 0.25 * C(u) * C(v) * s
  }
  return out
}
// The reference inverse transform: floating point, exact to the definition in T.81 A.3.3.
const idct = (coef) => {
  const out = new Float64Array(64), tmp = new Float64Array(64)
  for (let v = 0; v < 8; v++) for (let x = 0; x < 8; x++) { let s = 0; for (let u = 0; u < 8; u++) s += C(u) * coef[v * 8 + u] * cosTable[x * 8 + u]; tmp[v * 8 + x] = s / 2 }
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { let s = 0; for (let v = 0; v < 8; v++) s += C(v) * tmp[v * 8 + x] * cosTable[y * 8 + v]; out[y * 8 + x] = s / 2 }
  return out
}
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v)
// A plane of w by h samples, padded by repeating its last column and row up to pw by ph.
const padPlane = (plane, w, h, pw, ph) => {
  const out = new Float64Array(pw * ph)
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) out[y * pw + x] = plane[Math.min(y, h - 1) * w + Math.min(x, w - 1)]
  return out
}
// Quantized coefficients of every 8 by 8 block of a padded plane, and the samples they decode to.
const codePlane = (plane, pw, ph, table) => {
  const blocks = [], decoded = new Float64Array(pw * ph), block = new Float64Array(64)
  for (let by = 0; by < ph / 8; by++) {
    const row = []
    for (let bx = 0; bx < pw / 8; bx++) {
      for (let i = 0; i < 64; i++) block[i] = plane[(by * 8 + (i >> 3)) * pw + bx * 8 + (i & 7)] - 128
      const f = fdct(block), q = new Int32Array(64), deq = new Float64Array(64)
      for (let i = 0; i < 64; i++) { q[i] = Math.round(f[i] / table[i]); deq[i] = q[i] * table[i] }
      const s = idct(deq)
      for (let i = 0; i < 64; i++) decoded[(by * 8 + (i >> 3)) * pw + bx * 8 + (i & 7)] = clamp(Math.round(s[i] + 128))
      row.push(q)
    }
    blocks.push(row)
  }
  return { blocks, decoded }
}
class BitWriter {
  constructor() { this.bytes = []; this.acc = 0; this.n = 0 }
  put(value, len) {
    for (let i = len - 1; i >= 0; i--) {
      this.acc = (this.acc << 1) | ((value >> i) & 1)
      if (++this.n === 8) { this.bytes.push(this.acc); if (this.acc === 0xff) this.bytes.push(0); this.acc = 0; this.n = 0 }
    }
  }
  flush() { if (this.n) this.put(0x7f, 8 - this.n) } // pad with one bits (T.81 F.1.2.3)
}
const category = (v) => { let a = Math.abs(v), n = 0; while (a) { n++; a >>= 1 } return n }
const putValue = (w, v, size) => { if (size) w.put(v > 0 ? v : v + (1 << size) - 1, size) }
const encodeBlock = (w, q, prev, dc, ac) => {
  const diff = q[0] - prev, s = category(diff)
  w.put(...dc.get(s)); putValue(w, diff, s)
  let run = 0
  for (let k = 1; k < 64; k++) {
    const v = q[zigzag[k]]
    if (v === 0) { run++; continue }
    while (run > 15) { w.put(...ac.get(0xf0)); run -= 16 }
    const size = category(v)
    assert.ok(size <= 10, 'AC coefficient out of range for baseline')
    w.put(...ac.get((run << 4) | size)); putValue(w, v, size)
    run = 0
  }
  if (run) w.put(...ac.get(0x00))
}
const segment = (marker, body) => Buffer.concat([Buffer.from([0xff, marker, (body.length + 2) >> 8, (body.length + 2) & 255]), Buffer.from(body)])
// Draws an RGB picture and encodes it. Returns the file and the reference RGB picture (floating point).
const encodeJpeg = (rgb, w, h, subsampled, restart) => {
  const Y = new Float64Array(w * h), Cb = new Float64Array(w * h), Cr = new Float64Array(w * h)
  for (let p = 0; p < w * h; p++) {
    const r = rgb[p * 3], g = rgb[p * 3 + 1], b = rgb[p * 3 + 2]
    Y[p] = 0.299 * r + 0.587 * g + 0.114 * b
    Cb[p] = -0.168736 * r - 0.331264 * g + 0.5 * b + 128
    Cr[p] = 0.5 * r - 0.418688 * g - 0.081312 * b + 128
  }
  const mcu = subsampled ? 16 : 8, mx = Math.ceil(w / mcu), my = Math.ceil(h / mcu)
  const yPlane = codePlane(padPlane(Y, w, h, mx * mcu, my * mcu), mx * mcu, my * mcu, quant[0])
  let cw = w, ch = h, cb = Cb, cr = Cr
  if (subsampled) { // average each 2 by 2 square of the edge-padded plane
    cw = Math.ceil(w / 2); ch = Math.ceil(h / 2)
    const half = (plane) => {
      const full = padPlane(plane, w, h, cw * 2, ch * 2), out = new Float64Array(cw * ch)
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) out[y * cw + x] = (full[2 * y * cw * 2 + 2 * x] + full[2 * y * cw * 2 + 2 * x + 1] + full[(2 * y + 1) * cw * 2 + 2 * x] + full[(2 * y + 1) * cw * 2 + 2 * x + 1]) / 4
      return out
    }
    cb = half(Cb); cr = half(Cr)
  }
  const cbPlane = codePlane(padPlane(cb, cw, ch, mx * 8, my * 8), mx * 8, my * 8, quant[1])
  const crPlane = codePlane(padPlane(cr, cw, ch, mx * 8, my * 8), mx * 8, my * 8, quant[1])
  // Entropy-coded data, interleaved MCUs, with restart markers every `restart` MCUs.
  const out = new BitWriter(), pred = [0, 0, 0]
  let count = 0
  for (let y = 0; y < my; y++) for (let x = 0; x < mx; x++) {
    if (restart && count && count % restart === 0) { out.flush(); out.bytes.push(0xff, 0xd0 + ((count / restart - 1) & 7)); pred.fill(0) }
    const lumaBlocks = subsampled ? [[2 * y, 2 * x], [2 * y, 2 * x + 1], [2 * y + 1, 2 * x], [2 * y + 1, 2 * x + 1]] : [[y, x]]
    for (const [by, bx] of lumaBlocks) { const q = yPlane.blocks[by][bx]; encodeBlock(out, q, pred[0], codes.dc0, codes.ac0); pred[0] = q[0] }
    for (const [c, plane] of [[1, cbPlane], [2, crPlane]]) { const q = plane.blocks[y][x]; encodeBlock(out, q, pred[c], codes.dc1, codes.ac1); pred[c] = q[0] }
    count++
  }
  out.flush()
  const sampling = subsampled ? 0x22 : 0x11
  const file = Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    segment(0xe0, [0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]), // JFIF 1.01, no thumbnail
    segment(0xdb, [0x00, ...zigzag.map((i) => quant[0][i]), 0x01, ...zigzag.map((i) => quant[1][i])]),
    segment(0xc0, [8, h >> 8, h & 255, w >> 8, w & 255, 3, 1, sampling, 0, 2, 0x11, 1, 3, 0x11, 1]),
    segment(0xc4, [0x00, ...huff.dc0[0], ...huff.dc0[1], 0x10, ...huff.ac0[0], ...huff.ac0[1], 0x01, ...huff.dc1[0], ...huff.dc1[1], 0x11, ...huff.ac1[0], ...huff.ac1[1]]),
    ...(restart ? [segment(0xdd, [restart >> 8, restart & 255])] : []),
    segment(0xda, [3, 1, 0x00, 2, 0x11, 3, 0x11, 0, 63, 0]),
    Buffer.from(out.bytes),
    Buffer.from([0xff, 0xd9]),
  ])
  // The reference: decoded samples, chroma upsampled by centred linear interpolation
  // (weights 3/4 and 1/4, edges repeated), then the JFIF YCbCr to RGB conversion.
  const yp = mx * mcu, cp = mx * 8
  const chromaAt = (plane, x, y) => {
    if (!subsampled) return plane[y * cp + x]
    const fx = Math.min(Math.max((x + 0.5) / 2 - 0.5, 0), cw - 1), fy = Math.min(Math.max((y + 0.5) / 2 - 0.5, 0), ch - 1)
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(x0 + 1, cw - 1), y1 = Math.min(y0 + 1, ch - 1), ax = fx - x0, ay = fy - y0
    return (plane[y0 * cp + x0] * (1 - ax) + plane[y0 * cp + x1] * ax) * (1 - ay) + (plane[y1 * cp + x0] * (1 - ax) + plane[y1 * cp + x1] * ax) * ay
  }
  const ref = new Float64Array(w * h * 3), planes = { y: new Float64Array(w * h), cb: new Float64Array(w * h), cr: new Float64Array(w * h) }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x, l = yPlane.decoded[y * yp + x], b = chromaAt(cbPlane.decoded, x, y) - 128, r = chromaAt(crPlane.decoded, x, y) - 128
    planes.y[p] = l; planes.cb[p] = b; planes.cr[p] = r
    ref[p * 3] = clamp(l + 1.402 * r); ref[p * 3 + 1] = clamp(l - 0.344136 * b - 0.714136 * r); ref[p * 3 + 2] = clamp(l + 1.772 * b)
  }
  return { file, ref, planes }
}
// Pictures: chroma that varies smoothly or in large regions, luma with fine detail (grain,
// thin lines, small checks), so that skipping the AC coefficients is visible while every sound
// way of upsampling chroma gives nearly the same colours.
const painters = [
  // photographic stand-in: smooth colour waves plus luma grain
  (w, h, r) => (x, y) => { const g = (r() - 0.5) * 40; return [128 + 90 * Math.sin(x / 31 + y / 53) + g, 128 + 90 * Math.sin(x / 47 - y / 37) + g, 128 + 90 * Math.cos(y / 41) + g] },
  // document: light page, dark thin rules and dots, a tinted margin
  (w, h) => (x, y) => { const ink = y % 12 === 5 || (y % 12 < 9 && (x * 7 + (y >> 2) * 13) % 23 < 2); const v = ink ? 30 : 238; return x < w / 5 ? [v * 0.8, v * 0.9, v] : [v, v, v * 0.96] },
  // gradient under a 4-pixel luma checkerboard
  (w, h) => (x, y) => { const c = ((x >> 2) + (y >> 2)) & 1 ? 40 : -40; return [x * 200 / w + 28 + c, y * 200 / h + 28 + c, 200 - (x + y) * 150 / (w + h) + c] },
  // four large saturated regions, blended over 40 pixels where they meet, with fine luma noise
  (w, h, r) => { const s = (t) => { const u = t < -1 ? 0 : t > 1 ? 1 : (t + 1) / 2; return u * u * (3 - 2 * u) }, q = [[200, 40, 40], [40, 170, 70], [40, 70, 210], [230, 210, 50]]
    return (x, y) => { const g = (r() - 0.5) * 30, a = s((x - w / 2) / 20), b = s((y - h / 2) / 20); return [0, 1, 2].map((k) => (q[0][k] * (1 - a) + q[1][k] * a) * (1 - b) + (q[2][k] * (1 - a) + q[3][k] * a) * b + g) } },
  // concentric rings in luma over a slow hue sweep
  (w, h) => (x, y) => { const dx = x - w / 2, dy = y - h / 2, d = Math.sqrt(dx * dx + dy * dy), l = 60 * Math.sin(d / 2.5); return [130 + 80 * Math.cos(x / 90) + l, 130 + 80 * Math.sin(y / 70) + l, 130 - 60 * Math.cos((x + y) / 110) + l] },
  // heavy luma noise on a mid colour (much entropy-coded data)
  (w, h, r) => (x, y) => { const g = (r() - 0.5) * 160; return [150 + g, 110 + g, 90 + g + x * 40 / w] },
]
// [width, height] — some not multiples of 8 or 16, so decoders must crop the padded edge.
const sizes = [[64, 64], [256, 256], [320, 240], [400, 300], [512, 384], [200, 150], [128, 96], [333, 211], [97, 201], [480, 270], [160, 160], [250, 125]]
const fixtures = []
for (let i = 0; i < 24; i++) {
  let [w, h] = sizes[(i * 5 + (i >> 2)) % sizes.length]
  if (i % painters.length === 5) { w = Math.min(w, 200); h = Math.min(h, 150) }
  const r = rng(301 + i), paint = painters[i % painters.length](w, h, r), rgb = new Float64Array(w * h * 3)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = paint(x, y); for (let k = 0; k < 3; k++) rgb[(y * w + x) * 3 + k] = clamp(Math.round(p[k])) }
  const subsampled = i % 2 === 1, restart = i % 3 === 2 ? 1 + (i % 7) : 0
  fixtures.push({ width: w, height: h, subsampled, ...encodeJpeg(rgb, w, h, subsampled, restart) })
}
// Smallest images: one pixel, and 17 by 9 (a partial MCU in both directions), in both samplings.
for (const [w, h, subsampled] of [[1, 1, false], [1, 1, true], [17, 9, false], [17, 9, true]]) {
  const paint = (x, y) => { const c = ((x >> 2) + (y >> 2)) & 1 ? 40 : -40; return [90 + 3 * x + c, 110 + 2 * y + c, 170 - x - y + c] }, rgb = new Float64Array(w * h * 3)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = paint(x, y); for (let k = 0; k < 3; k++) rgb[(y * w + x) * 3 + k] = clamp(Math.round(p[k])) }
  fixtures.push({ width: w, height: h, subsampled, ...encodeJpeg(rgb, w, h, subsampled, 0) })
}
// An input is the JPEG file as a lowercase hex string; each adapter turns it into bytes in its untimed prepare step.
export const cases = fixtures.map(({ file }) => ({ input: file.toString('hex') }))

const bytesOf = (data) => typeof data === 'string' ? Buffer.from(data, 'base64') : Buffer.from(data.buffer, data.byteOffset, data.byteLength)
// Mean absolute difference from the reference, in levels of 255 over the three colour channels:
// over the whole picture, and over the worst 8 by 8 square (so a single wrong block shows).
export const errorOf = (i, pixels, channels) => {
  const { width: w, height: h, ref } = fixtures[i]
  let sum = 0
  const bw = Math.ceil(w / 8), blockSum = new Float64Array(bw * Math.ceil(h / 8)), blockCount = new Float64Array(blockSum.length)
  for (let p = 0; p < w * h; p++) {
    if (channels === 4) assert.equal(pixels[p * 4 + 3], 255, `fixture ${i}: an RGBA output must be opaque`)
    let d = 0
    for (let k = 0; k < 3; k++) d += Math.abs(pixels[p * channels + k] - ref[p * 3 + k])
    sum += d
    const b = ((p / w | 0) >> 3) * bw + ((p % w) >> 3)
    blockSum[b] += d; blockCount[b] += 3
  }
  let block = 0
  for (let b = 0; b < blockSum.length; b++) block = Math.max(block, blockSum[b] / blockCount[b])
  return { mean: sum / (w * h * 3), block }
}
export const MAX_MEAN_ERROR = 2.5
export const MAX_BLOCK_ERROR = 6
// An output is { width, height, data }: data holds width * height * 3 bytes of RGB, or
// width * height * 4 bytes of RGBA with every alpha 255, as a byte array or a base64 string.
export const verifyOne = (i, out) => {
  const { width, height } = fixtures[i]
  assert.ok(out && typeof out === 'object', `fixture ${i}: object output required`)
  assert.equal(out.width, width, `fixture ${i}: width`)
  assert.equal(out.height, height, `fixture ${i}: height`)
  const pixels = bytesOf(out.data), channels = pixels.length / (width * height)
  assert.ok(channels === 3 || channels === 4, `fixture ${i}: ${pixels.length} bytes is neither RGB nor RGBA for ${width} by ${height}`)
  const { mean, block } = errorOf(i, pixels, channels)
  assert.ok(mean <= MAX_MEAN_ERROR, `fixture ${i}: the pixels differ from the reference by ${mean.toFixed(2)} levels on average (limit ${MAX_MEAN_ERROR})`)
  assert.ok(block <= MAX_BLOCK_ERROR, `fixture ${i}: an 8 by 8 square differs from the reference by ${block.toFixed(2)} levels on average (limit ${MAX_BLOCK_ERROR})`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.data.length

// Proof that the check fails decoders that did not do the job, on one fixture of each sampling:
// red and blue swapped, luma only, chroma dropped (Cb = Cr = 0), the AC coefficients of luma
// skipped (each 8 by 8 square its average), and each luma block transposed (coefficients read
// in the wrong order). Each must be refused.
export const wrongOutputs = (i) => {
  const { width: w, height: h, planes, ref } = fixtures[i], n = w * h
  const make = (f) => { const px = Buffer.alloc(n * 3); for (let p = 0; p < n; p++) { const [r, g, b] = f(p); px[p * 3] = clamp(Math.round(r)); px[p * 3 + 1] = clamp(Math.round(g)); px[p * 3 + 2] = clamp(Math.round(b)) } return px }
  const rgbOf = (l, b, r) => [l + 1.402 * r, l - 0.344136 * b - 0.714136 * r, l + 1.772 * b]
  const averaged = new Float64Array(n), transposed = Float64Array.from(planes.y)
  for (let by = 0; by < h; by += 8) for (let bx = 0; bx < w; bx += 8) {
    const bh = Math.min(8, h - by), bw = Math.min(8, w - bx)
    let sum = 0
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) sum += planes.y[(by + y) * w + bx + x]
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) averaged[(by + y) * w + bx + x] = sum / (bw * bh)
    if (bh === 8 && bw === 8) for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) transposed[(by + y) * w + bx + x] = planes.y[(by + x) * w + bx + y]
  }
  return {
    'red and blue swapped': make((p) => [ref[p * 3 + 2], ref[p * 3 + 1], ref[p * 3]]),
    'luma only': make((p) => [planes.y[p], planes.y[p], planes.y[p]]),
    'chroma dropped': make((p) => rgbOf(planes.y[p], 0, 0)),
    'luma AC coefficients skipped': make((p) => rgbOf(averaged[p], planes.cb[p], planes.cr[p])),
    'luma blocks transposed': make((p) => rgbOf(transposed[p], planes.cb[p], planes.cr[p])),
  }
}
for (const i of [0, 3]) for (const [what, data] of Object.entries(wrongOutputs(i))) {
  assert.throws(() => verifyOne(i, { width: fixtures[i].width, height: fixtures[i].height, data }), undefined, `the check must refuse a decoder that gives ${what} (fixture ${i})`)
}
