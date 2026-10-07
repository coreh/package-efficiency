import { strict as assert } from 'node:assert'
const headers = ['id', 'name', 'city', 'price', 'qty', 'active', 'score', 'note']
const names = ['Ada Lovelace', 'Grace Hopper', 'Linus T.', 'José Álvarez', 'Zoë Müller', 'Mary O\'Neil', 'Ken R.', 'Anna K.']
const cities = ['São Paulo', 'Zürich', 'New York', 'Oslo', 'Paris', 'Lagos', 'Kraków', 'Austin']
const notes = ['ok', 'needs review', 'a, b & c', 'shipped (late)', '50% off', 'n/a', 'see #42', 'café con leche']
const row = (t, r) => {
  const k = t * 131 + r * 17
  return [t * 1000 + r, names[k % 8], cities[(k >> 1) % 8], (k * 37 % 10000) / 4, k % 500, k % 3 === 0, (k % 97) / 8, notes[(k >> 2) % 8]]
}
const sizes = Array.from({ length: 40 }, (_, t) => 3 + ((t * 7) % 58))
export const cases = sizes.map((n, t) => {
  const rows = Array.from({ length: n }, (_, r) => row(t, r))
  return { input: { headers, rows }, expected: [headers, ...rows.map((r) => r.map(String))] }
})
const plain = (s) => s.replace(/\x1b\[[0-9;]*m/g, '')
const alnum = /[\p{L}\p{N}]/u
// Display width. Every character in the fixtures, and every border character
// the packages draw, is one code point occupying one terminal column, so
// counting code points is enough here.
const width = (s) => [...s].length
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.equal(typeof out, 'string', `fixture ${i}: string output required`)
    // Content lines are those with a letter or digit; border and separator lines have none.
    const lines = plain(out).split('\n').filter((l) => alnum.test(l))
    assert.equal(lines.length, expected.length, `fixture ${i}: one line per row plus the header`)
    // Where each cell starts and ends on its line, in display columns. A cell
    // must appear exactly as String(cell) spells it, and nothing but padding
    // and border characters may stand between cells.
    const spans = expected.map((cells, r) => {
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
    // Alignment: in every column, all cells start at the same display column
    // (left-aligned) or all end at the same one (right-aligned).
    for (let c = 0; c < expected[0].length; c++) {
      const same = (edge) => spans.every((row) => row[c][edge] === spans[0][c][edge])
      assert.ok(same(0) || same(1), `fixture ${i} column ${c}: cells are neither left- nor right-aligned`)
    }
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
