import { strict as assert } from 'node:assert'
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789_-./'
const realistic = [
  'id', 'user_name', 'en-US', 'pt-BR', 'zh-Hant-TW', 'Content-Type', 'Accept-Encoding',
  'index.html', 'README.md', 'src/lib/parser.rs', 'node_modules/.bin/tsc',
  'localhost', 'application/json', 'X-Forwarded-For', 'https://example.com/a',
  'the quick brown fox jumps over',
]
// Every length from 1 to 40, built deterministically from a fixed alphabet.
const fill = (i, length) => Array.from({ length }, (_, j) => alphabet[(i * 7 + j * 5 + (j % 3) * 11) % alphabet.length]).join('')
const byLength = Array.from({ length: 40 }, (_, i) => fill(i, i + 1))
// Longer than any entry's inline capacity (24 bytes at most), so every type takes its heap path.
const longer = [
  ...[48, 64, 100, 160, 256].map((length, i) => fill(40 + i, length)),
  '/usr/local/lib/node_modules/typescript/lib/lib.es2022.intl.d.ts',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'the quick brown fox jumps over the lazy dog, then walks home and sleeps until the morning',
]
// Not ASCII: two-, three- and four-byte characters, from 5 to 99 bytes of UTF-8.
const nonAscii = [
  'café', 'São Paulo', '日本語', 'naïve.txt', 'Ωmega', 'ok 👍', 'Привет, мир', 'straße/größe.md',
  'données/année-2026/résumé-financier-détaillé.pdf', '東京都千代田区丸の内一丁目九番一号 グラントウキョウ',
  'Ünïcödé/путь/к/файлу/с/очень/длинным/именем/документа.txt', '🚀 deploy finished: 12 services, 0 failures ✅ 🎉',
]
// Each fixture is a pair: the text, and a second string to compare it with. Half the pairs are equal, a
// quarter differ in the last character and a quarter in the first, always at the same length in bytes, so the
// comparison has to read bytes and is not always true. '#' and '%' occur in no fixture text; a non-ASCII
// character is replaced by its neighbour, which takes the same number of UTF-8 bytes.
const swap = (c) => c === '#' ? '%' : c.codePointAt(0) < 128 ? '#' : String.fromCodePoint(c.codePointAt(0) ^ 1)
const otherFor = (text, i) => {
  const chars = Array.from(text)
  return i % 4 < 2 ? text
    : i % 4 === 2 ? chars.slice(0, -1).join('') + swap(chars.at(-1))
    : swap(chars[0]) + chars.slice(1).join('')
}
const bytes = (s) => Buffer.byteLength(s, 'utf8')
export const cases = [...byLength, ...realistic, ...longer, ...nonAscii].map((text, i) => {
  const other = otherFor(text, i)
  assert.equal(bytes(other), bytes(text), `fixture ${i}: both strings must have the same length in bytes`)
  assert.equal(other === text, i % 4 < 2, `fixture ${i}: pair must be ${i % 4 < 2 ? 'equal' : 'different'}`)
  return { input: { text, other }, expected: { text, length: bytes(text), equal: text === other } }
})
// Rust submits { text, length, equal } for each fixture before warm-up; length is in bytes of UTF-8.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.equal(typeof out, 'object', `fixture ${i}: object output required`)
    assert.equal(out.text, expected.text, `fixture ${i}: text`)
    assert.equal(out.length, expected.length, `fixture ${i}: length`)
    assert.equal(out.equal, expected.equal, `fixture ${i}: comparison of the clone with the second value`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
