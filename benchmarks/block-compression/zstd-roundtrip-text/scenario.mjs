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
// A round trip must restore the exact text, code point for code point.
// An output is { text, compressedBytes } where compressedBytes is the size of what the adapter's
// compression call produced for that input (reported outside timing). It must be smaller than the
// input's UTF-8 size for every fixture above MIN_BYTES, the random base64 and hex ones included:
// Zstandard has entropy coding and shrinks those too (the LZ4 task exempts them).
const MIN_BYTES = 300, RANDOM_EXEMPT = false
const utf8 = new TextEncoder()
const inputBytes = cases.map(({ input }) => utf8.encode(input).length)
const mustShrink = cases.map((_, i) => inputBytes[i] > MIN_BYTES && !(RANDOM_EXEMPT && i < 36 && (i % kinds.length === 7 || i % kinds.length === 8)))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const output = outputs[i]
    assert.ok(output !== null && typeof output === 'object', `fixture ${i}: { text, compressedBytes } output required`)
    const text = output.text
    assert.equal(typeof text, 'string', `fixture ${i}: string output required`)
    assert.equal(text, expected, `fixture ${i}`)
    const size = output.compressedBytes
    assert.ok(Number.isInteger(size) && size >= 0, `fixture ${i}: compressedBytes must be a byte count`)
    if (inputBytes[i] > 0) assert.ok(size > 0, `fixture ${i}: compressed output is empty`)
    if (mustShrink[i]) assert.ok(size < inputBytes[i], `fixture ${i}: compressed to ${size} bytes, input is ${inputBytes[i]}`)
  }
}
// JavaScript adapters attach operation.compressedBytes(input): the same compression call as the
// operation, returning the size of its output. It is called here only, never in the measured loop.
export const verify = (operation) => {
  assert.equal(typeof operation.compressedBytes, 'function', 'operation.compressedBytes(input) is required')
  verifyResults(cases.map(({ input }) => ({ text: operation(input), compressedBytes: operation.compressedBytes(input) })))
}
export const consume = (value) => value.length
