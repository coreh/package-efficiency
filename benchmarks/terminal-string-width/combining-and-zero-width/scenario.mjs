import { strict as assert } from 'node:assert'
// Independent oracle: zero for marks and format characters, two for Wide/Fullwidth, else one.
const wide = (cp) =>
  (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0x303e) || (cp >= 0x3041 && cp <= 0x33ff) ||
  (cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0xac00 && cp <= 0xd7a3) ||
  (cp >= 0xff01 && cp <= 0xff60) || (cp >= 0xffe0 && cp <= 0xffe6)
const zero = /^[\p{Mn}\p{Me}\p{Cf}]$/u
const widthReference = (s) => {
  let w = 0
  for (const ch of s) w += zero.test(ch) ? 0 : wide(ch.codePointAt(0)) ? 2 : 1
  return w
}
const parts = [
  'café crème brulée', 'naïve Zoë Müller', 'à é î õ ü ñ',
  'Приве́т, ми́р', 'Καλημέρα κόσμε', 'Hello​, ​world', 'zero‌width⁠joiner',
  '﻿BOM prefixed text', 'שָׁלוֹם עוֹלָם', 'مَرْحَبًا بِالْعَالَمِ', 'สวัสดีครับ', 'ภาษาไทย ทดสอบ',
  'がぎぐ', '日本語​のテキスト', '你好​世界', '한국어‌텍스트', 'ＡＢＣ́１２３',
  'ẋ̣ ỵ̇ ẓ̇', 'stacked à́̂̃ marks', 'src/index.ts​:42:7',
  'npm install​ --save-dev', 'ファイル​: README.md', 'éééé',
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
