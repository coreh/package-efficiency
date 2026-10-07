import { strict as assert } from 'node:assert'
// Each sample: [text, NFC, NFD, NFKC, NFKD], written by hand from the Unicode data.
const samples = [
  ['Plain ASCII text 123', 'Plain ASCII text 123', 'Plain ASCII text 123', 'Plain ASCII text 123', 'Plain ASCII text 123'],
  ['café crème brûlée', 'café crème brûlée', 'café crème brûlée', 'café crème brûlée', 'café crème brûlée'],
  ['café naïve', 'café naïve', 'café naïve', 'café naïve', 'café naïve'],
  ['o\ufb03ce e\ufb00ect \ufb02ow', 'o\ufb03ce e\ufb00ect \ufb02ow', 'o\ufb03ce e\ufb00ect \ufb02ow', 'office effect flow', 'office effect flow'],
  ['①② x² H₂O ™', '①② x² H₂O ™', '①② x² H₂O ™', '12 x2 H2O TM', '12 x2 H2O TM'],
  ['Å ngström', 'Å ngström', 'Å ngström', 'Å ngström', 'Å ngström'],
  ['한글 안녕', '한글 안녕', '한글 안녕', '한글 안녕', '한글 안녕'],
  ['한글', '한글', '한글', '한글', '한글'],
  ['ｱｲｳ ｶﾞ ﾊﾟ', 'ｱｲｳ ｶﾞ ﾊﾟ', 'ｱｲｳ ｶﾞ ﾊﾟ', 'アイウ ガ パ', 'アイウ ガ パ'],
  ['ạ̇ q̣̇', 'ạ̇ q̣̇', 'ạ̇ q̣̇', 'ạ̇ q̣̇', 'ạ̇ q̣̇'],
  ['ẛ̣', 'ẛ̣', 'ẛ̣', 'ṩ', 'ṩ'],
  ['Добрый й ёж مرحبا 日本語', 'Добрый й ёж مرحبا 日本語', 'Добрый й ёж مرحبا 日本語', 'Добрый й ёж مرحبا 日本語', 'Добрый й ёж مرحبا 日本語'],
]
const forms = ['NFC', 'NFD', 'NFKC', 'NFKD']
export const cases = []
for (const [f, form] of forms.entries()) {
  for (const [s, sample] of samples.entries()) {
    const reps = 1 + ((s * 7 + f * 3) % 9) * ((s + f) % 3 === 0 ? 12 : 1)
    const parts = Array(reps).fill(0)
    cases.push({
      input: [form, parts.map(() => sample[0]).join(' ')],
      expected: parts.map(() => sample[1 + f]).join(' '),
    })
  }
}
cases.push({ input: ['NFC', ''], expected: '' })
assert.equal(cases.length, 49)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
