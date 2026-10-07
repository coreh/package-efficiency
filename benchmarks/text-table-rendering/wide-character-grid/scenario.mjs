import { strict as assert } from 'node:assert'
const headers = ['id', 'name', 'city', 'price', 'qty', 'status', 'note']
const nfd = (s) => s.normalize('NFD')
// Names mix wide CJK / Hangul / fullwidth text with Latin text whose accents are
// combining marks (NFD), so display width differs from code point count.
const names = ['田中太郎', '山田花子', '김민준', '李小龍', nfd('José Álvarez'), nfd('Zoë Müller'), 'Ａｄａ　Ｌｏｖｅ', '佐藤 Ken', nfd('Anaïs Nin'), '박서연', 'Grace H.', '王芳']
const cities = ['東京', '大阪市', '서울', '北京', nfd('São Paulo'), nfd('Zürich'), 'Ｏｓｌｏ', 'Lagos', nfd('Kraków'), '上海', 'ソウル', 'Austin']
const notes = ['確認済み', '要レビュー', '완료', '出荷 (遅延)', 'ok', nfd('café con leche'), '50% 割引', 'ｎ／ａ', '見積もり済', 'a, b & c', '재고 부족', nfd('crème brûlée')]
const status = ['有効', '無効', '활성', 'active', '保留', 'Ｏ Ｋ']
const row = (t, r) => {
  const k = t * 131 + r * 17
  return [t * 1000 + r, names[k % 12], cities[(k >> 1) % 12], (k * 37 % 10000) / 4, k % 500, status[(k >> 3) % 6], notes[(k >> 2) % 12]]
}
const sizes = Array.from({ length: 36 }, (_, t) => 3 + ((t * 7) % 58))
export const cases = sizes.map((n, t) => {
  const rows = Array.from({ length: n }, (_, r) => row(t, r))
  return { input: { headers, rows }, expected: [headers, ...rows.map((r) => r.map(String))] }
})
// Canonically equivalent spellings are accepted: some packages return composed (NFC) text.
const plain = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').normalize('NFC')
const alnum = /[\p{L}\p{N}]/u
// Display width in terminal columns: combining marks 0; CJK ideographs, kana,
// Hangul syllables and fullwidth forms 2; everything else (including border
// characters) 1. The fixtures use only these classes.
const width = (s) => {
  let w = 0
  for (const ch of s) {
    const c = ch.codePointAt(0)
    if ((c >= 0x300 && c <= 0x36f)) continue
    w += (c >= 0x1100 && c <= 0x115f) || (c >= 0x3000 && c <= 0x303e) || (c >= 0x3040 && c <= 0x30ff) || (c >= 0x4e00 && c <= 0x9fff) || (c >= 0xac00 && c <= 0xd7a3) || (c >= 0xff01 && c <= 0xff60) ? 2 : 1
  }
  return w
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.equal(typeof out, 'string', `fixture ${i}: string output required`)
    const exp = expected.map((r) => r.map((x) => x.normalize('NFC')))
    const lines = plain(out).split('\n').filter((l) => alnum.test(l))
    assert.equal(lines.length, exp.length, `fixture ${i}: one line per row plus the header`)
    const spans = exp.map((cells, r) => {
      let at = 0
      const row = cells.map((cell, c) => {
        const found = lines[r].indexOf(cell, at)
        assert.ok(found >= 0, `fixture ${i} line ${r} column ${c}: cell ${JSON.stringify(cell)} not found in ${JSON.stringify(lines[r])}`)
        assert.ok(!alnum.test(lines[r].slice(at, found)), `fixture ${i} line ${r} column ${c}: unexpected text before ${JSON.stringify(cell)}`)
        const start = width(lines[r].slice(0, found))
        at = found + cell.length
        return [start, start + width(cell)]
      })
      assert.ok(!alnum.test(lines[r].slice(at)), `fixture ${i} line ${r}: unexpected text after the last cell`)
      return row
    })
    for (let c = 0; c < exp[0].length; c++) {
      const same = (edge) => spans.every((row) => row[c][edge] === spans[0][c][edge])
      assert.ok(same(0) || same(1), `fixture ${i} column ${c}: cells are neither left- nor right-aligned by display width`)
    }
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
