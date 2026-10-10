import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { deflateSync } from 'node:zlib'
// The asynchronous form of image-decoding/png-rgba: the same 38 files and the same exact check, written
// out again here because a scenario is loaded alone beside each adapter. Keep the two in step.
// Deterministic generator (fixed seeds, no Math.random) for 8-bit RGBA PNG files.
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
// mode 0..4: that filter type on every row; mode 5: filter type cycles by row.
const filterRows = (px, w, h, mode) => {
  const stride = w * 4, out = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) {
    const t = mode === 5 ? y % 5 : mode
    out[y * (stride + 1)] = t
    for (let i = 0; i < stride; i++) {
      const cur = px[y * stride + i]
      const a = i >= 4 ? px[y * stride + i - 4] : 0
      const b = y > 0 ? px[(y - 1) * stride + i] : 0
      const c = y > 0 && i >= 4 ? px[(y - 1) * stride + i - 4] : 0
      const pred = t === 0 ? 0 : t === 1 ? a : t === 2 ? b : t === 3 ? (a + b) >> 1 : paeth(a, b, c)
      out[y * (stride + 1) + 1 + i] = (cur - pred) & 255
    }
  }
  return out
}
const encodePng = (px, w, h, mode, level) => {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8-bit RGBA, deflate, adaptive filtering, no interlace
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(filterRows(px, w, h, mode), { level })), chunk('IEND', Buffer.alloc(0))])
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
  // horizontal bands with noise rows
  (w, h, r) => (x, y) => y % 16 < 12 ? [60 + (y >> 4) * 9 & 255, 90, 160, 255] : [r() * 256, r() * 256, 40, 255],
]
const sizes = [[64, 64], [128, 96], [200, 150], [256, 256], [320, 240], [400, 300], [160, 160], [96, 128], [512, 128], [100, 300]]
const render = (i, w, h) => {
  const r = rng(77 + i), paint = painters[i % painters.length](w, h, r), px = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = paint(x, y); for (let k = 0; k < 4; k++) px[(y * w + x) * 4 + k] = p[k] }
  return px
}
const files = [], expected = []
for (let i = 0; i < 36; i++) {
  let [w, h] = sizes[(i * 7 + (i >> 3)) % sizes.length]
  if (i % painters.length === 5) { w = Math.min(w, 128); h = Math.min(h, 96) }
  const px = render(i, w, h)
  files.push(encodePng(px, w, h, i % 6, [1, 6, 9][i % 3]))
  expected.push({ width: w, height: h, data: px })
}
// Smallest images: one pixel, and a 16 by 16 sprite.
for (const [w, h] of [[1, 1], [16, 16]]) { const px = render(7, w, h); files.push(encodePng(px, w, h, 5, 6)); expected.push({ width: w, height: h, data: px }) }
// An input is the PNG file as a lowercase hex string; each adapter turns it into bytes in its untimed prepare step.
export const cases = files.map((f) => ({ input: f.toString('hex') }))

// filterRows with the filter byte of each row dropped: the bytes a decoder that never undid the filters would give.
const unfiltered = (i) => {
  const { width: w, height: h, data } = expected[i], stride = w * 4, rows = filterRows(data, w, h, i < 36 ? i % 6 : 5), out = Buffer.alloc(data.length)
  for (let y = 0; y < h; y++) rows.copy(out, y * stride, y * (stride + 1) + 1, (y + 1) * (stride + 1))
  return out
}
const bytesOf = (data) => Buffer.from(data.buffer, data.byteOffset, data.byteLength)
// An output is { width, height, data }: data holds width * height * 4 bytes of RGBA, row by row, as a
// Uint8Array, a Buffer or a Uint8ClampedArray (what the library's image object holds).
export const verifyOne = (i, out) => {
  const want = expected[i]
  assert.ok(out && typeof out === 'object', `fixture ${i}: object output required`)
  assert.equal(out.width, want.width, `fixture ${i}: width`)
  assert.equal(out.height, want.height, `fixture ${i}: height`)
  assert.ok(ArrayBuffer.isView(out.data) && out.data.BYTES_PER_ELEMENT === 1, `fixture ${i}: the pixels must be a byte array`)
  const got = bytesOf(out.data)
  assert.equal(got.length, want.width * want.height * 4, `fixture ${i}: pixel buffer length`)
  assert.ok(got.equals(want.data), `fixture ${i}: pixels differ from the generator's`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
// Each operation is awaited before the next one starts.
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (value) => value.data.length

// Proof that the check refuses decoders that did not do the job: red and blue swapped, the rows upside
// down, alpha dropped (made 255), colours premultiplied by alpha, the row filters left undone, another
// fixture's pixels, the input file's bytes, and a buffer of the right size never filled.
const wrongOutputs = (i) => {
  const { width: w, height: h, data } = expected[i], n = w * h, stride = w * 4
  const map = (f) => { const out = Buffer.from(data); for (let q = 0; q < n * 4; q += 4) f(out, q); return out }
  const flipped = Buffer.alloc(data.length)
  for (let y = 0; y < h; y++) data.copy(flipped, (h - 1 - y) * stride, y * stride, (y + 1) * stride)
  const other = expected[(i + 1) % expected.length].data, file = files[i]
  const wrong = {
    'red and blue swapped': map((o, q) => { o[q] = data[q + 2]; o[q + 2] = data[q] }),
    'rows upside down': flipped,
    'alpha dropped': map((o, q) => { o[q + 3] = 255 }),
    'premultiplied colours': map((o, q) => { for (let k = 0; k < 3; k++) o[q + k] = Math.round(data[q + k] * data[q + 3] / 255) }),
    'filters left undone': unfiltered(i),
    "another fixture's pixels": Buffer.concat([other, Buffer.alloc(data.length)]).subarray(0, data.length),
    'the input file': Buffer.concat([file, Buffer.alloc(data.length)]).subarray(0, data.length),
    'never filled': Buffer.alloc(data.length),
  }
  // A mistake that happens to give the right pixels on this picture is no proof; keep the others.
  return Object.fromEntries(Object.entries(wrong).filter(([, out]) => !out.equals(data)))
}
const refused = new Set()
for (const i of [0, 4, 6, 7, 11, 37]) {
  const { width, height, data } = expected[i]
  verifyOne(i, { width, height, data })
  verifyOne(i, { width, height, data: new Uint8ClampedArray(data) }) // a Uint8ClampedArray is as good as a Buffer
  for (const [what, wrongData] of Object.entries(wrongOutputs(i))) {
    assert.throws(() => verifyOne(i, { width, height, data: wrongData }), undefined, `the check must refuse a decoder that gives ${what} (fixture ${i})`)
    refused.add(what)
  }
  assert.throws(() => verifyOne(i, { width, height, data: data.toString('base64') }), undefined, `the check must refuse base64 text in place of bytes (fixture ${i})`)
  if (width !== height) assert.throws(() => verifyOne(i, { width: height, height: width, data }), undefined, `the check must refuse a swapped width and height (fixture ${i})`)
}
assert.equal(refused.size, 8, `every mistake must be shown refused on some fixture; shown: ${[...refused].join(', ')}`)
