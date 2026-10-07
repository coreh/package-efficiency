import { strict as assert } from 'node:assert'
import { inflateRawSync } from 'node:zlib'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const words = 'the of and to in is that for it as was with be by on not he this are or his from at which but have an had they you were their one all we can her has there been if more when will would who so no data system model request value result error time user'.split(' ')
const prose = (r, n) => Array.from({ length: n }, () => words[Math.floor(r() * words.length)]).join(' ')
const hex = (r, n) => Array.from({ length: n }, () => Math.floor(r() * 256).toString(16).padStart(2, '0')).join('')
const b64 = (r, n) => { const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; return Array.from({ length: n }, () => a[Math.floor(r() * 64)]).join('') }
const jsonRecords = (r, n) => JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: i, name: `user-${Math.floor(r() * 1000)}`, email: `u${i}@example.com`, active: r() < 0.5, score: Math.round(r() * 10000) / 100, tags: ['a', 'b', 'c'].slice(0, 1 + Math.floor(r() * 3)) })))
const logLines = (r, n) => Array.from({ length: n }, (_, i) => `2026-10-06T12:${String(i % 60).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}Z INFO request id=${Math.floor(r() * 1e6)} path=/api/v1/items/${Math.floor(r() * 500)} status=${[200, 200, 200, 404, 500][Math.floor(r() * 5)]} ms=${Math.floor(r() * 300)}`).join('\n')
const csv = (r, n) => ['id,city,temp,humidity'].concat(Array.from({ length: n }, (_, i) => `${i},${['Lisbon', 'São Paulo', 'Tokyo', 'Oslo'][Math.floor(r() * 4)]},${(r() * 40 - 5).toFixed(1)},${Math.floor(r() * 100)}`)).join('\n')
const code = (r, n) => Array.from({ length: n }, (_, i) => `export function handler${i}(req, res) {\n  const value = req.params.id${i};\n  if (!value) { return res.status(${400 + Math.floor(r() * 5)}).send('missing'); }\n  return res.json({ id: value, ok: true, n: ${Math.floor(r() * 1e4)} });\n}\n`).join('\n')
const html = (r, n) => `<!doctype html><html><body>${Array.from({ length: n }, (_, i) => `<div class="item item-${i % 4}"><h2>Title ${i}</h2><p>${prose(r, 12)}</p><a href="/items/${i}">more</a></div>`).join('\n')}</body></html>`
const unicode = (r, n) => Array.from({ length: n }, () => ['café', '日本語のテキスト', 'Привет мир', 'naïve résumé', '😀 emoji'][Math.floor(r() * 5)]).join(' ')
// [generator, units for a ~10 KB input]; scaled by the size class below.
const kinds = [
  [(r, n) => prose(r, n), 1800, true], [(r, n) => jsonRecords(r, n), 100, true], [(r, n) => logLines(r, n), 85, true], [(r, n) => csv(r, n), 450, true],
  [(r, n) => code(r, n), 90, true], [(r, n) => html(r, n), 60, true], [(r, n) => unicode(r, n), 700, true], [(r, n) => b64(r, n), 10000, false],
]
const scales = [1, 3, 8, 20]
export const cases = []
for (let i = 0; i < 32; i++) {
  const [gen, units, shrinks] = kinds[i % kinds.length]
  const scale = scales[Math.floor(i / kinds.length)] * (1 + (i % 3) * 0.25)
  const input = gen(rng(5000 + i), Math.round(units * scale))
  cases.push({ input, shrinks })
}
const utf8 = new TextEncoder()
const inputBytes = cases.map(({ input }) => utf8.encode(input))
// An output is the compressed bytes: a Uint8Array/Buffer (JavaScript), an array of integers
// (Rust, Python, Ruby) or a base64 string (Go's []byte through encoding/json). It must be a valid raw
// deflate stream that inflates to exactly the input; text fixtures must also get smaller by at least a
// fifth, which rules out stored-block "compression"; the random base64 fixtures only have to be valid.
const toBytes = (o) => typeof o === 'string' ? Buffer.from(o, 'base64') : Buffer.from(o)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { shrinks }] of cases.entries()) {
    const o = outputs[i]
    assert.ok(typeof o === 'string' || (o !== null && typeof o === 'object' && o.length > 0), `fixture ${i}: compressed bytes required`)
    const packed = toBytes(o)
    assert.ok(packed.length > 0, `fixture ${i}: empty output`)
    const restored = inflateRawSync(packed)
    assert.ok(restored.equals(inputBytes[i]), `fixture ${i}: does not inflate to the input`)
    if (shrinks) assert.ok(packed.length < inputBytes[i].length * 0.8, `fixture ${i}: ${packed.length} bytes from ${inputBytes[i].length}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
