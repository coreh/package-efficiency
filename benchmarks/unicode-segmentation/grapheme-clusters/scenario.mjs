import { strict as assert } from 'node:assert'
// Each fixture is built from a list of known extended grapheme clusters; the
// input is their concatenation and the expected result is the list itself, so
// the oracle is independent of any library. Only clusters whose segmentation is
// the same in every Unicode version since 11 are used (no Indic conjuncts).
const latin = ['a', 'e', 't', 'o', 'n', ' ', ' ', 's', 'r', 'i', '.', ',', 'T', 'é', 'é', 'ñ', 'ö', 'ç', 'ạ̀', 'ß', '\n', '1', '9']
const cjk = ['日', '本', '語', '中', '文', '字', '、', '。', '한', '글', '한', '각ᆨ', 'あ', 'り', 'が', 'ガ', 'ガ']
const emoji = ['😀', '👍', '👍🏽', '👨‍👩‍👧‍👦', '🧑‍🚀', '🏳️‍🌈', '🇧🇷', '🇯🇵', '🇺🇸', '❤️', '1️⃣', '🎉', ' ', '✌🏿', '🤝🏻']
const indic = ['कि', 'न', 'म', 'स', 'का', ' ', 'ก', 'ข', 'กำ', 'กิ', 'ก้', 'ส', 'ว', 'ด', 'ا', 'بَ', 'ل', 'م', 'عّ', 'ר', 'ב', ' ']
const mixed = [...latin.slice(0, 12), ...cjk.slice(0, 8), ...emoji.slice(0, 9), ...indic.slice(0, 8), '\r\n', 'é']
const pools = [latin, cjk, emoji, indic, mixed]
let seed = 20261006
const rand = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296
// 48 fixtures: short lines to a few KB paragraphs, each drawn from one pool.
const lengths = [4, 9, 16, 24, 40, 64, 96, 150, 220, 360, 600, 1000]
export const cases = Array.from({ length: 48 }, (_, i) => {
  const pool = pools[i % pools.length]
  const n = lengths[(i * 5 + (i >> 2)) % lengths.length]
  const expected = Array.from({ length: n }, () => pool[Math.floor(rand() * pool.length)])
  return { input: expected.join(''), expected }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected, input }] of cases.entries()) {
    assert.ok(Array.isArray(outputs[i]), `fixture ${i}: list of clusters required`)
    assert.equal(outputs[i].join(''), input, `fixture ${i}: clusters must cover the text`)
    assert.deepEqual(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
