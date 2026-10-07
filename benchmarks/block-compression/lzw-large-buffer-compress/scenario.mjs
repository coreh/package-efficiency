import { strict as assert } from 'node:assert'
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
// Each kind gets a size parameter n; the output is roughly 20 to 200 KB.
const kinds = [
  { name: 'prose', n: 4000, make: (r, n) => prose(r, n) },
  { name: 'json', n: 700, make: jsonRecords },
  { name: 'logs', n: 900, make: logLines },
  { name: 'csv', n: 3000, make: csv },
  { name: 'code', n: 250, make: (r, n) => code(n) },
  { name: 'html', n: 450, make: html },
  { name: 'unicode', n: 4000, make: unicode },
  { name: 'base64', n: 20000, make: b64, random: true },
  { name: 'hex', n: 10000, make: hex, random: true },
  { name: 'repeat', n: 600, make: (r, n) => 'abcd'.repeat(n * 10) + prose(r, n) },
  // Mixed corpus: text sections interleaved with random base64 blobs, like an embedded-asset document.
  { name: 'mixed', n: 100, make: (r, n) => [jsonRecords(r, n), b64(r, n * 60), logLines(r, n), hex(r, n * 20), prose(r, n * 8), code(n / 4)].join('\n') },
]
const scales = [0.25, 1, 2.5]
export const cases = []
for (let i = 0; i < 33; i++) {
  const k = kinds[i % kinds.length], scale = scales[Math.floor(i / kinds.length)]
  const r = rng(5000 + i)
  cases.push({ input: k.make(r, Math.max(2, Math.round(k.n * scale * (1 + (i % 3) * 0.1)))), random: !!k.random })
}
const utf8 = new TextEncoder()
const inputBytes = cases.map(({ input }) => utf8.encode(input).length)
// Compressing: an output is { text, compressedBytes }, the text restored by decompressing the adapter's
// own output and the size of that output, both reported outside timing.
// Every fixture except the random base64 and hex ones must compress to under 90% of its size, which an
// adapter that returns or truncates the input, or a constant, cannot meet while also restoring the text.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  const sizes = new Set()
  for (const [i, { input, random }] of cases.entries()) {
    const output = outputs[i]
    assert.ok(output !== null && typeof output === 'object', `fixture ${i}: { text, compressedBytes } output required`)
    assert.equal(output.text, input, `fixture ${i}: decompressed text differs from the input`)
    const size = output.compressedBytes
    assert.ok(Number.isInteger(size) && size > 0, `fixture ${i}: compressed size must be a positive byte count`)
    sizes.add(size)
    if (random) assert.ok(size > inputBytes[i] * 0.4, `fixture ${i}: random data cannot compress this far (${size} of ${inputBytes[i]})`)
    else assert.ok(size < inputBytes[i] * 0.9, `fixture ${i}: compressed to ${size} bytes, input is ${inputBytes[i]}`)
  }
  assert.ok(sizes.size > cases.length / 2, 'compressed sizes must differ between fixtures')
}
// JavaScript adapters attach operation.decode(compressed): the matching decompression, used here only.
export const verify = (operation) => {
  assert.equal(typeof operation.decode, 'function', 'operation.decode(compressed) is required')
  verifyResults(cases.map(({ input }) => {
    const packed = operation(input)
    return { text: operation.decode(packed), compressedBytes: packed.length }
  }))
}
export const consume = (value) => value.length
