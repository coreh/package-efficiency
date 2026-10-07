import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const words = 'the of and to in is that for it as was with be by on not he this are or his from at which but have an had they you were their one all we can her has there been'.split(' ')
const prose = (r, n) => Array.from({ length: n }, () => words[Math.floor(r() * words.length)]).join(' ')
const b64 = (r, n) => { const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; return Array.from({ length: n }, () => a[Math.floor(r() * 64)]).join('') }
const code = (r, n) => Array.from({ length: n }, (_, i) => `export function handler${i}(req, res) {\n  const value = req.params.id${i};\n  if (!value) return res.status(400).send('missing');\n  return res.json({ id: value, ok: ${r() < 0.5} });\n}\n`).join('\n')
const json = (r, n) => JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: i, name: `user-${Math.floor(r() * 1000)}`, active: r() < 0.5, score: Math.round(r() * 10000) / 100, tags: ['a', 'b', 'c'].slice(0, 1 + Math.floor(r() * 3)) })), null, 2)
const log = (r, n) => Array.from({ length: n }, (_, i) => `2026-10-06T12:${String(i % 60).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}Z INFO path=/api/v1/items/${Math.floor(r() * 500)} status=${[200, 200, 404, 500][Math.floor(r() * 4)]} ms=${Math.floor(r() * 300)}`).join('\n')
const csv = (r, n) => ['id,city,temp'].concat(Array.from({ length: n }, (_, i) => `${i},${['Lisbon', 'São Paulo', 'Tokyo', 'Oslo'][Math.floor(r() * 4)]},${(r() * 40 - 5).toFixed(1)}`)).join('\n')
const unicode = (r, n) => Array.from({ length: n }, () => ['café', '日本語のテキスト', 'Привет мир', 'naïve résumé', '😀 emoji'][Math.floor(r() * 5)]).join(' ')
const kinds = [
  ['src/handlers.js', code, 4], ['data/users.json', json, 5], ['logs/app.log', log, 8], ['data/cities.csv', csv, 14],
  ['README.md', (r, n) => `# Project\n\n${prose(r, n)}\n`, 40], ['docs/guide/日本語.txt', unicode, 20], ['docs/café.md', unicode, 12],
  ['blob/payload.b64', b64, 300], ['empty.txt', () => '', 0], ['notes/a b/c.txt', prose, 25], ['LICENSE', prose, 90], ['bin/pad.txt', () => 'abcd'.repeat(120), 0],
]
export const cases = []
for (let i = 0; i < 40; i++) {
  const r = rng(5000 + i)
  const count = 1 + (i * 5) % 9
  const input = []
  for (let j = 0; j < count; j++) {
    const [name, make, size] = kinds[(i * 3 + j * 5) % kinds.length]
    input.push({ name: `${name.replace(/(\.[^./]+)?$/, (e) => `-${j}${e}`)}`, text: make(r, size + ((i + j) % 7)) })
  }
  cases.push({ input, expected: input })
}
cases.push({ input: [{ name: 'only.txt', text: '' }], expected: [{ name: 'only.txt', text: '' }] })
// Large archives: one to three entries of 100 KB to about 300 KB of
// compressible text each, so compressing the data, not per-entry setup, is
// most of the work. These are also the fixtures whose archive size is checked.
const large = [
  [['logs/big-app.log', log, 1600]],
  [['data/big-users.json', json, 1100]],
  [['src/big-handlers.js', code, 700], ['docs/big-notes.txt', prose, 30000]],
  [['data/big-cities.csv', csv, 9000], ['logs/big-access.log', log, 2800]],
  [['docs/big-日本語.txt', unicode, 9000], ['data/big-export.json', json, 2400], ['LICENSE-big', prose, 70000]],
  [['book/big-chapter.txt', prose, 60000]],
]
for (const [i, entries] of large.entries()) {
  const r = rng(9000 + i)
  const input = entries.map(([name, make, size]) => ({ name, text: make(r, size) }))
  cases.push({ input, expected: input, compressible: true })
}
const utf8Bytes = (entries) => entries.reduce((sum, { text }) => sum + Buffer.byteLength(text), 0)
// Each output is { entries, archiveBytes }: the extracted entries and the byte
// length of the archive they were read from.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected, compressible }] of cases.entries()) {
    const { entries: out, archiveBytes } = outputs[i] ?? {}
    assert.ok(Array.isArray(out), `fixture ${i}: a list of entries is required`)
    assert.equal(out.length, expected.length, `fixture ${i}: entry count`)
    for (const [j, entry] of expected.entries()) {
      assert.deepStrictEqual(Object.keys(out[j]).sort(), ['name', 'text'], `fixture ${i} entry ${j}: fields`)
      assert.equal(out[j].name, entry.name, `fixture ${i} entry ${j}: name`)
      assert.equal(out[j].text, entry.text, `fixture ${i} entry ${j}: text`)
    }
    assert.ok(Number.isInteger(archiveBytes) && archiveBytes > 0, `fixture ${i}: archiveBytes must be a positive integer`)
    // Storing the data, or handing the input back, cannot be smaller than the input.
    if (compressible) assert.ok(archiveBytes < utf8Bytes(expected), `fixture ${i}: archive of ${archiveBytes} bytes is not smaller than its ${utf8Bytes(expected)} bytes of input`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.entries.length
