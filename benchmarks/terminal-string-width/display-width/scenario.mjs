import { strict as assert } from 'node:assert'
// Independent oracle: width 2 for Wide/Fullwidth code points used in the fixtures.
const wide = (cp) =>
  (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0x303e) || (cp >= 0x3041 && cp <= 0x33ff) ||
  (cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0xac00 && cp <= 0xd7a3) ||
  (cp >= 0xff01 && cp <= 0xff60) || (cp >= 0xffe0 && cp <= 0xffe6) || (cp >= 0x1f600 && cp <= 0x1f64f) ||
  (cp >= 0x1f680 && cp <= 0x1f6c5) || cp === 0x1f389 || cp === 0x1f525 || cp === 0x1f680
const widthReference = (s) => { let w = 0; for (const ch of s) w += wide(ch.codePointAt(0)) ? 2 : 1; return w }
const parts = [
  'Hello, world', 'The quick brown fox jumps over the lazy dog', 'npm install --save-dev', 'src/index.ts:42:7',
  'café crème brûlée', 'naïve Zoë Müller', 'Привет, мир', 'Καλημέρα κόσμε',
  '日本語のテキスト', 'こんにちは世界', 'カタカナ', '你好，世界', '中文字符串测试', '한국어 텍스트', '안녕하세요',
  'ＡＢＣ１２３', 'ｈｅｌｌｏ', '😀 done', '🎉 release 🚀', '🔥🔥🔥', 'build ✔ 完了', 'ファイル: README.md', '名前 name 이름',
]
export const cases = Array.from({ length: 60 }, (_, i) => {
  const input = `${parts[i % parts.length]}${i % 3 === 0 ? ' ' + parts[(i * 7 + 3) % parts.length] : ''}`.repeat(1 + (i % 5 === 4 ? 6 : i % 3))
  return { input, expected: widthReference(input) }
})
cases.push({ input: '', expected: 0 })
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'number', `fixture ${i}: number output required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value
