import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const pick = (r, a) => a[Math.floor(r() * a.length)]
const words = 'the of and to in is that for it as was with be by on not he this are or his from at which but have an had they you were their one all we can her has there been'.split(' ')
const prose = (r, n) => Array.from({ length: n }, () => pick(r, words)).join(' ')
const code = (r, n) => Array.from({ length: n }, (_, i) => `export function handler${i}(req, res) {\n  const value = req.params.id${i};\n  if (!value) return res.status(${pick(r, [400, 404, 422])}).send('missing');\n  return res.json({ id: value, ok: ${r() < 0.5} });\n}\n`).join('\n')
const json = (r, n) => JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: i, name: `user-${Math.floor(r() * 1000)}`, active: r() < 0.5, score: Math.round(r() * 10000) / 100 })), null, 2)
const locale = (r, n) => JSON.stringify(Object.fromEntries(Array.from({ length: n }, (_, i) => [`key.${i}`, pick(r, ['Olá, mundo', 'Configurações', '日本語のテキスト', 'Привет мир', 'Save changes', 'café au lait', 'Ça marche'])])), null, 2)
const log = (r, n) => Array.from({ length: n }, (_, i) => `2026-10-06T12:${String(i % 60).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}Z INFO path=/api/v1/items/${Math.floor(r() * 500)} status=${pick(r, [200, 200, 404, 500])}`).join('\n')
const csv = (r, n) => ['id,city,temp'].concat(Array.from({ length: n }, (_, i) => `${i},${pick(r, ['Lisbon', 'São Paulo', 'Tokyo', 'Oslo'])},${(r() * 40 - 5).toFixed(1)}`)).join('\n')
const md = (r, n) => `# Notes ${Math.floor(r() * 100)}\n\n${prose(r, n)}\n`
// [directory, extension, generator, size range start, size span]
const kinds = [
  ['src/components', 'js', code, 2, 10], ['src/util', 'ts', code, 1, 8], ['config', 'json', json, 1, 12], ['locales', 'json', locale, 4, 30],
  ['docs/guide', 'md', md, 30, 300], ['data', 'csv', csv, 8, 60], ['logs', 'log', log, 3, 25], ['assets/texts/日本語', 'txt', prose, 20, 200],
  ['docs/café', 'md', md, 20, 150],
]
export const cases = []
for (let i = 0; i < 36; i++) {
  const r = rng(7000 + i)
  const count = 40 + Math.floor(((i * 37) % 36) * 10) // 40 to 390 entries
  const input = []
  for (let j = 0; j < count; j++) {
    const [dir, ext, make, lo, span] = kinds[(i + j * 7 + Math.floor(r() * 3)) % kinds.length]
    input.push({ name: `${dir}/part${Math.floor(j / 9)}/file-${j}.${ext}`, text: make(r, lo + Math.floor(r() * span)) })
  }
  if (i % 6 === 0) input[Math.floor(count / 2)].text = '' // an empty file
  cases.push({ input, expected: input })
}
const utf8Bytes = (entries) => entries.reduce((sum, { text }) => sum + Buffer.byteLength(text), 0)
// Each output is { entries, archiveBytes }: the extracted entries and the byte
// length of the archive they were read from.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const { entries: out, archiveBytes } = outputs[i] ?? {}
    assert.ok(Array.isArray(out), `fixture ${i}: a list of entries is required`)
    assert.equal(out.length, expected.length, `fixture ${i}: entry count`)
    for (const [j, entry] of expected.entries()) {
      assert.deepStrictEqual(Object.keys(out[j]).sort(), ['name', 'text'], `fixture ${i} entry ${j}: fields`)
      assert.equal(out[j].name, entry.name, `fixture ${i} entry ${j}: name`)
      assert.equal(out[j].text, entry.text, `fixture ${i} entry ${j}: text`)
    }
    assert.ok(Number.isInteger(archiveBytes) && archiveBytes > 0, `fixture ${i}: archiveBytes must be a positive integer`)
    // Every fixture is compressible text, so even with per-entry headers a real
    // deflate archive is smaller than its input; storing or echoing is not.
    assert.ok(archiveBytes < utf8Bytes(expected), `fixture ${i}: archive of ${archiveBytes} bytes is not smaller than its ${utf8Bytes(expected)} bytes of input`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.entries.length
