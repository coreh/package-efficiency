import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Deterministic first bytes of files: a real header per format, then filler.
let seed = 20261007
const rnd = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) >>> 8
const filler = (n) => Array.from({ length: n }, () => rnd() & 255)
const ascii = (s) => [...Buffer.from(s, 'latin1')]
const le32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255]
const le16 = (n) => [n & 255, (n >> 8) & 255]
const be32 = (n) => le32(n).reverse()
const sizes = [64, 300, 1024, 4096]

// Each format: a builder (variant index, total size) and the MIME types accepted for it.
// An accepted type is a name the registry or the library's own table gives for the same format.
const formats = {
  png: {
    accept: ['image/png'],
    build: (v, n) => [0x89, ...ascii('PNG\r\n\x1a\n'), ...be32(13), ...ascii('IHDR'), ...be32(16 + v * 40), ...be32(16 + v * 24), 8, 6, 0, 0, 0, ...filler(4), ...be32(n), ...ascii('IDAT')],
  },
  jpeg: {
    accept: ['image/jpeg'],
    build: (v) => v % 2 ? [0xff, 0xd8, 0xff, 0xe1, 0x00, 0x20, ...ascii('Exif\0\0MM\0*')] : [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, ...ascii('JFIF\0'), 1, 1, 0, 0, 1, 0, 1, 0, 0],
  },
  gif: {
    accept: ['image/gif'],
    build: (v) => [...ascii(v % 2 ? 'GIF87a' : 'GIF89a'), ...le16(20 + v * 9), ...le16(30 + v * 7), 0xf7, 0, 0],
  },
  webp: {
    accept: ['image/webp'],
    build: (v, n) => [...ascii('RIFF'), ...le32(n - 8), ...ascii('WEBP'), ...ascii(['VP8 ', 'VP8L', 'VP8X', 'VP8 '][v]), ...le32(n - 20)],
  },
  bmp: {
    accept: ['image/bmp', 'image/x-ms-bmp'],
    build: (v, n) => [...ascii('BM'), ...le32(n), 0, 0, 0, 0, ...le32(54), ...le32(40), ...le32(16 + v), ...le32(16 + v), 1, 0, 24, 0],
  },
  pdf: {
    accept: ['application/pdf'],
    build: (v) => [...ascii(`%PDF-1.${3 + v}\n%`), 0xe2, 0xe3, 0xcf, 0xd3, ...ascii('\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')],
  },
  zip: {
    accept: ['application/zip'],
    build: (v) => [...ascii('PK\x03\x04'), 20, 0, 0, 0, v % 2 ? 8 : 0, 0, ...filler(8), ...le32(100 + v), ...le32(100 + v), 5, 0, 0, 0, ...ascii('a.txt')],
  },
  gzip: {
    accept: ['application/gzip', 'application/x-gzip'],
    build: (v) => [0x1f, 0x8b, 8, 0, ...filler(4), v % 2 ? 2 : 0, 3],
  },
  wasm: {
    accept: ['application/wasm'],
    build: () => [0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 1, 7, 1, 0x60, 2, 0x7f, 0x7f, 1, 0x7f],
  },
  wav: {
    accept: ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave'],
    build: (v, n) => [...ascii('RIFF'), ...le32(n - 8), ...ascii('WAVEfmt '), ...le32(16), 1, 0, 1 + (v % 2), 0, ...le32(44100), ...le32(88200), 2, 0, 16, 0, ...ascii('data'), ...le32(n - 44)],
  },
  mp4: {
    accept: ['video/mp4'],
    build: (v) => [...be32(24), ...ascii('ftypisom'), ...be32(512), ...ascii('isom'), ...ascii('mp41')],
  },
  mp3: {
    accept: ['audio/mpeg'],
    build: (v) => [...ascii('ID3'), 3 + (v % 2), 0, 0, 0, 0, 0x1f, 0x76],
  },
  rar: {
    accept: ['application/vnd.rar', 'application/x-rar-compressed', 'application/x-rar'],
    build: (v) => v % 2 ? [...ascii('Rar!\x1a\x07\x01\x00'), ...filler(4)] : [...ascii('Rar!\x1a\x07\x00'), ...filler(4)],
  },
  ogg: {
    accept: ['audio/ogg', 'application/ogg', 'video/ogg'],
    build: () => [...ascii('OggS'), 0, 2, ...filler(8), ...le32(0x1234), ...le32(0), ...le32(0), 1, 30, 1, ...ascii('vorbis'), 0, 0, 0, 0, 2],
  },
}
const rows = []
for (const [name, f] of Object.entries(formats)) {
  sizes.forEach((n, v) => {
    const head = f.build(v, n)
    const bytes = head.concat(filler(Math.max(0, n - head.length))).slice(0, Math.max(n, head.length))
    rows.push({ name, hex: Buffer.from(bytes).toString('hex') })
  })
}
// Mix the formats so neighbouring calls differ.
const order = rows.map((_, i) => rows[(i * 17) % rows.length])
assert.equal(new Set(order).size, rows.length)
const names = order.map((r) => r.name)
export const cases = order.map((r) => ({ input: r.hex, expected: formats[r.name].accept }))
export const verifyOne = (i, output) => {
  const accept = formats[names[i]].accept
  assert.ok(typeof output === 'string' && accept.includes(output.split(';')[0].trim().toLowerCase()), `fixture ${i} (${names[i]}): got ${JSON.stringify(output)}, expected one of ${accept.join(', ')}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  const failures = []
  for (let i = 0; i < cases.length; i++) {
    try { verifyOne(i, outputs[i]) } catch (e) { failures.push(e.message) }
  }
  assert.ok(failures.length === 0, `${failures.length} failing: ${[...new Set(failures.map((f) => f.replace(/^fixture \d+ /, '')))].join(' | ')}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => (result == null ? 0 : result.length)
