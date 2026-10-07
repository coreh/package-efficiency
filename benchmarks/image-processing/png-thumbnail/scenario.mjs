import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { deflateSync, inflateSync } from 'node:zlib'
// Deterministic 8-bit RGBA PNG files (opaque), and the thumbnail each must become.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'latin1')
  Buffer.from(data).copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}
const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
const encodePng = (px, w, h) => {
  const stride = w * 4, raw = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) {
    const t = [1, 2, 4, 3][y % 4] // sub, up, Paeth, average, row by row
    raw[y * (stride + 1)] = t
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? px[y * stride + i - 4] : 0, b = y > 0 ? px[(y - 1) * stride + i] : 0, c = y > 0 && i >= 4 ? px[(y - 1) * stride + i - 4] : 0
      raw[y * (stride + 1) + 1 + i] = (px[y * stride + i] - (t === 1 ? a : t === 2 ? b : t === 3 ? (a + b) >> 1 : paeth(a, b, c))) & 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))])
}
// Content with no detail finer than the thumbnail can show, plus a faint grain
// (up to 8 levels either way), as a photograph has: every sound way of resampling then
// agrees on the result to within a small error.
const painters = [
  (w, h) => (x, y) => [x * 255 / w, y * 255 / h, 255 - (x + y) * 255 / (w + h)],
  (w, h) => (x, y) => [[200, 30, 30], [30, 160, 60], [30, 60, 200], [240, 220, 40]][(x * 2 / w | 0) + 2 * (y * 2 / h | 0)],
  (w, h) => (x, y) => { const dx = x - w * 0.4, dy = y - h * 0.6, d = Math.sqrt(dx * dx + dy * dy); return [128 + 110 * Math.sin(d / 23), 128 + 110 * Math.cos(d / 31), 90 + d / 4] },
  (w, h) => (x, y) => [128 + 100 * Math.sin(x / 37 + y / 61), 128 + 100 * Math.sin(x / 53 - y / 43), 128 + 100 * Math.cos(y / 47)],
  (w, h) => (x, y) => { const dx = x - w / 2, dy = y - h / 2; return dx * dx / (w * w) + dy * dy / (h * h) < 0.09 ? [230, 140, 30] : x < w / 3 ? [20, 40, 90] : [70 + x * 120 / w, 150, 200 - y * 100 / h] },
]
// [source width, source height, reduction factor]
const shapes = [[256, 256, 4], [512, 384, 4], [640, 480, 4], [384, 288, 3], [600, 400, 5], [480, 320, 2], [800, 600, 8], [320, 480, 4], [512, 512, 8], [720, 540, 6], [400, 400, 4], [1024, 256, 4]]
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))
const fixtures = shapes.map(([w, h, factor], i) => {
  const grain = rng(101 + i), paint = painters[i % painters.length](w, h), px = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = paint(x, y), o = (y * w + x) * 4
    for (let k = 0; k < 3; k++) px[o + k] = clamp(p[k] + (grain() - 0.5) * 16)
    px[o + 3] = 255
  }
  // The reference thumbnail: the plain average of each factor-by-factor block.
  const tw = w / factor, th = h / factor, ref = new Float64Array(tw * th * 3)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let k = 0; k < 3; k++) ref[(((y / factor) | 0) * tw + ((x / factor) | 0)) * 3 + k] += px[(y * w + x) * 4 + k] / (factor * factor)
  return { png: encodePng(px, w, h), width: tw, height: th, ref }
})
// An input is { png, width, height }: the file as a lowercase hex string (an
// adapter turns it into bytes in its untimed prepare step) and the size wanted.
export const cases = fixtures.map(({ png, width, height }) => ({ input: { png: png.toString('hex'), width, height } }))

// A PNG reader for the check: 8-bit grey, grey+alpha, palette, RGB or RGBA, not interlaced.
export const decodePng = (file) => {
  assert.ok(file.length > 33 && file.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'not a PNG file')
  let pos = 8, header = null, palette = null, transparency = null
  const data = []
  while (pos + 12 <= file.length) {
    const length = file.readUInt32BE(pos), type = file.toString('latin1', pos + 4, pos + 8), body = file.subarray(pos + 8, pos + 8 + length)
    assert.equal(file.readUInt32BE(pos + 8 + length), crc32(file.subarray(pos + 4, pos + 8 + length)), `bad CRC in ${type} chunk`)
    if (type === 'IHDR') header = { width: body.readUInt32BE(0), height: body.readUInt32BE(4), depth: body[8], colour: body[9], interlace: body[12] }
    else if (type === 'PLTE') palette = body
    else if (type === 'tRNS') transparency = body
    else if (type === 'IDAT') data.push(body)
    else if (type === 'IEND') break
    pos += 12 + length
  }
  assert.ok(header, 'no IHDR chunk')
  const { width, height, depth, colour, interlace } = header
  assert.ok(depth === 8 && interlace === 0, `only 8-bit, non-interlaced PNG output is read (depth ${depth}, interlace ${interlace})`)
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colour]
  assert.ok(channels, `unknown colour type ${colour}`)
  const raw = inflateSync(Buffer.concat(data)), stride = width * channels
  assert.equal(raw.length, (stride + 1) * height, 'pixel data has the wrong length')
  const px = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y++) {
    const t = raw[y * (stride + 1)]
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? px[y * stride + i - channels] : 0, b = y > 0 ? px[(y - 1) * stride + i] : 0, c = y > 0 && i >= channels ? px[(y - 1) * stride + i - channels] : 0
      px[y * stride + i] = (raw[y * (stride + 1) + 1 + i] + (t === 0 ? 0 : t === 1 ? a : t === 2 ? b : t === 3 ? (a + b) >> 1 : paeth(a, b, c))) & 255
    }
  }
  const rgba = Buffer.alloc(width * height * 4)
  for (let p = 0; p < width * height; p++) {
    const s = p * channels, o = p * 4
    if (colour === 0 || colour === 4) { rgba[o] = rgba[o + 1] = rgba[o + 2] = px[s]; rgba[o + 3] = colour === 4 ? px[s + 1] : 255 }
    else if (colour === 3) { rgba[o] = palette[px[s] * 3]; rgba[o + 1] = palette[px[s] * 3 + 1]; rgba[o + 2] = palette[px[s] * 3 + 2]; rgba[o + 3] = transparency?.[px[s]] ?? 255 }
    else { rgba[o] = px[s]; rgba[o + 1] = px[s + 1]; rgba[o + 2] = px[s + 2]; rgba[o + 3] = colour === 6 ? px[s + 3] : 255 }
  }
  return { width, height, data: rgba }
}
const bytesOf = (out) => typeof out === 'string' ? Buffer.from(out, 'base64') : Buffer.from(out.buffer, out.byteOffset, out.byteLength)
// Mean absolute difference from the reference, in levels of 255, over the colour channels.
export const errorOf = (i, output) => {
  const { width, height, ref } = fixtures[i]
  const image = decodePng(bytesOf(output))
  assert.equal(image.width, width, `fixture ${i}: width`)
  assert.equal(image.height, height, `fixture ${i}: height`)
  let sum = 0, worst = 0
  for (let p = 0; p < width * height; p++) {
    assert.equal(image.data[p * 4 + 3], 255, `fixture ${i}: an opaque image came back with transparency`)
    for (let k = 0; k < 3; k++) { const d = Math.abs(image.data[p * 4 + k] - ref[p * 3 + k]); sum += d; if (d > worst) worst = d }
  }
  return { mean: sum / (width * height * 3), worst }
}
export const MAX_MEAN_ERROR = 2
export const verifyOne = (i, output) => {
  assert.ok(typeof output === 'string' || ArrayBuffer.isView(output), `fixture ${i}: PNG bytes (or their base64 text) are required`)
  const { mean } = errorOf(i, output)
  assert.ok(mean <= MAX_MEAN_ERROR, `fixture ${i}: the thumbnail differs from the reference by ${mean.toFixed(2)} levels on average (limit ${MAX_MEAN_ERROR})`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
