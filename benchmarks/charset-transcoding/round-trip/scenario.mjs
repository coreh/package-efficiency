import { strict as assert } from 'node:assert'
// Characters common to Shift_JIS, GBK and windows-1252 respectively; each
// non-ASCII character of the first two is two bytes, each of the last is one.
const pools = {
  shift_jis: ['日本語の文章を処理します。', 'ひらがなとカタカナ、漢字が混在する文です。', 'ＡＢＣ１２３　全角英数字！', '東京・大阪・京都へ行きました。', 'これはテストです（確認）。', '「引用」と『書名』です。'],
  gbk: ['中华人民共和国是一个伟大的国家。', '我们正在测试计算机软件，请稍等！', '汉字编码转换：简体中文文本。', '“你好”，他说，《程序设计》很有用？', '北京、上海、广州、深圳（一线城市）。', '数据库与网络通信协议。'],
  'windows-1252': ['Café déjà vu, naïve façade. ', 'Price: €100 — “quoted” and ‘single’ text… ', 'Größe, Straße, Æsir, œuvre, Ñandú. ', '© 2026 Müller & Søn™ ½ ± ° ', 'Señor Šostakovic, žluty kun, Ž. ', 'Plain ASCII text with digits 0123456789, and punctuation! ']
}
const ascii = ['Hello, world. ', 'id=42; ', 'x + y = z ', 'line one\nline two\t', '"quoted" <tag> ']
const width = (label, text) => [...text].reduce((n, c) => n + (label !== 'windows-1252' && c.codePointAt(0) > 127 ? 2 : 1), 0)
const labels = Object.keys(pools)
export const cases = Array.from({ length: 65 }, (_, i) => {
  const label = labels[i % 3], pool = pools[label]
  let text = ''
  const target = i < 6 ? 1 + i * 2 : 20 + (i * i * 23) % 1500
  for (let k = 0; text.length < target; k++) {
    text += pool[(i + k * 5) % pool.length]
    if (k % 3 === 2) text += ascii[(i + k) % ascii.length]
  }
  text = [...text].slice(0, target).join('')
  return { input: { encoding: label, text }, expected: [width(label, text), text] }
})
cases.push({ input: { encoding: 'gbk', text: '' }, expected: [0, ''] })
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.ok(Array.isArray(outputs[i]) && outputs[i].length === 2, `fixture ${i}: [byteLength, text] required`)
    assert.equal(typeof outputs[i][1], 'string', `fixture ${i}: text must be a string`)
    assert.deepEqual([outputs[i][0], outputs[i][1]], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value[0] + value[1].length
