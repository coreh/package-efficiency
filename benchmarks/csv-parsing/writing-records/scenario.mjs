import { strict as assert } from 'node:assert'
const names = ['Ana Souza', 'Smith, John', 'Zoë Müller', '日本 太郎', 'O\'Brien', 'Jean "JJ" Dupont', 'Maria  García', 'Łukasz Nowak']
const notes = ['plain text', 'has, comma', 'say "hello"', 'two\nlines', 'three\nlines\nhere', ' padded ', 'a,b,"c"', 'naïve café 😀', '', 'trailing quote"', '"leading quote', 'semi;colon\ttab', '""', ',', '\nstarts with newline']
const cities = ['São Paulo', 'New York', 'Zürich', 'Kraków', 'Tokyo', 'Paris, France', 'Rio']
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
const build = (i) => {
  const cols = 4 + (i % 7)
  const rows = 20 + (i * 5) % 181
  const kinds = Array.from({ length: cols }, (_, c) => c === 0 ? 0 : (c + i) % 7)
  const table = []
  for (let r = 0; r < rows; r++) table.push(kinds.map((k, c) => cell(k, r + i, c)))
  return { input: table, expected: table }
}
export const cases = Array.from({ length: 36 }, (_, i) => build(i))

// Strict reference parser: comma, double quote, quoted fields may hold line breaks and "".
// Rows end with \n or \r\n; nothing is trimmed.
const parse = (text) => {
  const rows = []
  let row = [], field = '', i = 0
  const n = text.length
  while (i < n) {
    if (text[i] === '"' && field === '') {
      i++
      for (;;) {
        assert.ok(i < n, 'unterminated quoted field')
        if (text[i] === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2 } else { i++; break }
        } else field += text[i++]
      }
      assert.ok(i >= n || text[i] === ',' || text[i] === '\n' || text[i] === '\r', 'garbage after closing quote')
    } else if (text[i] === ',') { row.push(field); field = ''; i++; if (i >= n) { row.push(''); rows.push(row); row = [] } }
    else if (text[i] === '\n' || (text[i] === '\r' && text[i + 1] === '\n')) { row.push(field); rows.push(row); row = []; field = ''; i += text[i] === '\r' ? 2 : 1 }
    else { assert.notEqual(text[i], '"', 'bare quote inside unquoted field'); field += text[i++] }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.equal(typeof out, 'string', `fixture ${i}: output must be a string`)
    assert.ok(out.length > expected.length * expected[0].length, `fixture ${i}: output too short`)
    assert.deepStrictEqual(parse(out), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (text) => text.length
