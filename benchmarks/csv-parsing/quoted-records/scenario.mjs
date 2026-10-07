import { strict as assert } from 'node:assert'
const names = ['Ana Souza', 'Smith, John', 'Zoë Müller', '日本 太郎', 'O\'Brien', 'Jean "JJ" Dupont', 'Maria  García', 'Łukasz Nowak']
const notes = ['plain text', 'has, comma', 'say "hello"', 'two\nlines', 'three\nlines\nhere', ' padded ', 'a,b,"c"', 'naïve café 😀', '', 'trailing quote"', '"leading quote', 'semi;colon\ttab']
const cities = ['São Paulo', 'New York', 'Zürich', 'Kraków', 'Tokyo', 'Paris, France', 'Rio']
// A field generator per column kind; some fields are quoted whether or not they need it.
const cell = (kind, r, c) => {
  switch (kind) {
    case 0: return String(r * 7 + c)
    case 1: return names[(r + c) % names.length]
    case 2: return (((r * 37 + c * 11) % 9000) / 100 + 1).toFixed(2)
    case 3: return `20${10 + (r % 15)}-${String(1 + (r % 12)).padStart(2, '0')}-${String(1 + (r * 3 % 28)).padStart(2, '0')}`
    case 4: return notes[(r * 5 + c) % notes.length]
    case 5: return cities[(r + 2 * c) % cities.length]
    default: return r % 4 === 0 ? '' : `item-${r}-${c}`
  }
}
const quote = (s, force) => (force || /[",\n]|^ | $/.test(s)) ? `"${s.replaceAll('"', '""')}"` : s
const build = (i) => {
  const cols = 4 + (i % 7)
  const rows = 20 + (i * 5) % 181
  const kinds = Array.from({ length: cols }, (_, c) => c === 0 ? 0 : (c + i) % 7)
  const table = []
  for (let r = 0; r < rows; r++) table.push(kinds.map((k, c) => cell(k, r + i, c)))
  const text = table.map((row, r) => row.map((s, c) => quote(s, s === '' ? (r + c) % 2 === 0 : (r * 3 + c + i) % 7 === 0)).join(',')).join('\n') + '\n'
  return { input: text, expected: table }
}
export const cases = Array.from({ length: 36 }, (_, i) => build(i))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out), `fixture ${i}: rows must be a list`)
    assert.equal(out.length, expected.length, `fixture ${i}: row count`)
    for (const [r, row] of out.entries()) {
      assert.ok(Array.isArray(row) && row.every((f) => typeof f === 'string'), `fixture ${i} row ${r}: list of strings required`)
    }
    assert.deepStrictEqual(out, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (rows) => rows.length
