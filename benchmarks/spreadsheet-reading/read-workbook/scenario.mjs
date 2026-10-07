import { strict as assert } from 'node:assert'
import { deflateRawSync } from 'node:zlib'
import { Buffer } from 'node:buffer'
// Deterministic generator (fixed seeds, no Math.random, no clock) for XLSX workbooks. The scenario writes the zip and the
// XML itself, so the expected cell values are known without any spreadsheet library.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const zip = (entries) => {
  const parts = [], central = []
  let offset = 0
  for (const [name, text] of entries) {
    const raw = Buffer.from(text, 'utf8'), data = deflateRawSync(raw, { level: 6 }), nameBytes = Buffer.from(name, 'utf8'), crc = crc32(raw)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8)
    local.writeUInt16LE(0x0021, 12) // 1980-01-01
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(nameBytes.length, 26)
    parts.push(local, nameBytes, data)
    const c = Buffer.alloc(46)
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10)
    c.writeUInt16LE(0x0021, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(raw.length, 24)
    c.writeUInt16LE(nameBytes.length, 28); c.writeUInt32LE(offset, 42)
    central.push(c, nameBytes)
    offset += 30 + nameBytes.length + data.length
  }
  const dir = Buffer.concat(central), end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(dir.length, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...parts, dir, end])
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const colName = (c) => { let s = ''; for (c++; c > 0; c = Math.floor((c - 1) / 26)) s = String.fromCharCode(65 + ((c - 1) % 26)) + s; return s }
const words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'Ünïcödé', 'naïve café', 'Tom & Jerry', '5 < 6 > 4', 'say "hi"', "it's", '日本語のテキスト', 'line one', 'north', 'south', 'east', 'west']
const workbook = (sheets) => {
  const strings = [], stringIndex = new Map()
  const sst = (s) => { if (!stringIndex.has(s)) { stringIndex.set(s, strings.length); strings.push(s) } return stringIndex.get(s) }
  const sheetXml = sheets.map(({ rows }) => {
    const body = rows.map((row, r) => `<row r="${r + 1}">${row.map((v, c) => {
      const ref = colName(c) + (r + 1)
      return typeof v === 'string' ? `<c r="${ref}" t="s"><v>${sst(v)}</v></c>` : typeof v === 'boolean' ? `<c r="${ref}" t="b"><v>${v ? 1 : 0}</v></c>` : `<c r="${ref}"><v>${v}</v></c>`
    }).join('')}</row>`).join('')
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${colName(rows[0].length - 1)}${rows.length}"/><sheetData>${body}</sheetData></worksheet>`
  })
  const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
  const entries = [
    ['[Content_Types].xml', head + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>'],
    ['_rels/.rels', head + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml', head + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map(({ name }, i) => `<sheet name="${esc(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels', head + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') + `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId${sheets.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`],
    ['xl/styles.xml', head + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>'],
    ...sheetXml.map((xml, i) => [`xl/worksheets/sheet${i + 1}.xml`, xml]),
  ]
  entries.push(['xl/sharedStrings.xml', head + `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">` + strings.map((s) => `<si><t>${esc(s)}</t></si>`).join('') + '</sst>'])
  return zip(entries)
}
// Cells are strings (always containing a letter), whole numbers, decimals with up to three places and no trailing zero, or booleans.
// Every row of a sheet has the same number of cells, and none is empty.
const makeCell = (r, kind, row, col) => {
  switch (kind) {
    case 'text': return `${words[(r() * words.length) | 0]} ${(r() * 40) | 0}x`
    case 'word': return words[(r() * words.length) | 0]
    case 'id': return row + 1000
    case 'int': return ((r() * 2000000) | 0) - 1000000
    case 'dec': return Number((r() * 10000 - 5000).toFixed(3)) + (col % 2 ? 0.5 : 0.125)
    case 'bool': return r() < 0.5
    default: return `unique-${row}-${col}-${(r() * 1e6) | 0}`
  }
}
const layouts = [
  ['id', 'word', 'int', 'dec', 'bool', 'text', 'dec', 'unique'],
  ['id', 'text', 'text', 'int', 'dec', 'bool'],
  ['word', 'dec', 'dec', 'int', 'int', 'bool', 'unique', 'id', 'word', 'dec'],
]
const specs = [
  { seed: 11, sheets: [['Summary', 1, 6], ['Données & Notes', 30, 6], ['日本語', 12, 4]] },
  { seed: 23, sheets: [['Sheet1', 200, 8], ['Q1 <draft>', 200, 6], ['Q2', 150, 8], ['Totals', 40, 10]] },
  { seed: 37, sheets: [['Orders', 400, 10], ['Customers', 300, 8], ['Flags', 300, 6]] },
]
const books = specs.map(({ seed, sheets }, b) => {
  const r = rng(seed)
  return sheets.map(([name, nrows, ncols], s) => {
    const layout = layouts[(b + s) % layouts.length].slice(0, ncols)
    while (layout.length < ncols) layout.push('text')
    return { name, rows: Array.from({ length: nrows }, (_, row) => layout.map((kind, col) => makeCell(r, kind, row, col))) }
  })
})
const files = books.map((sheets) => workbook(sheets))
// An input is the XLSX file as a lowercase hex string; each adapter turns it into bytes in its untimed prepare step.
export const cases = files.map((f) => ({ input: f.toString('hex') }))
// An output is a list of sheets in workbook order, each { name, rows }: rows is a list of rows, each a list of cell values.
// A library that only returns text for a cell may hand a number as its decimal text ("12.5") or a boolean as "TRUE"/"FALSE", or as the stored 1/0 (number or text), when it has no boolean type;
// a string cell must come back as a string, exactly.
const same = (got, want) => {
  if (typeof want === 'string') return got === want
  if (typeof want === 'boolean') return got === want || [want ? 1 : 0, want ? '1' : '0', want ? 'TRUE' : 'FALSE'].includes(got)
  return got === want || got === String(want)
}
export const verifyOne = (i, output) => {
  const want = books[i]
  assert.ok(Array.isArray(output), `fixture ${i}: a list of sheets is required`)
  assert.equal(output.length, want.length, `fixture ${i}: number of sheets`)
  for (const [s, sheet] of want.entries()) {
    const got = output[s]
    assert.ok(got && typeof got === 'object', `fixture ${i} sheet ${s}: object required`)
    assert.equal(got.name, sheet.name, `fixture ${i} sheet ${s}: name`)
    assert.ok(Array.isArray(got.rows), `fixture ${i} sheet ${s}: rows must be a list`)
    assert.equal(got.rows.length, sheet.rows.length, `fixture ${i} sheet ${s}: number of rows`)
    for (const [r, row] of sheet.rows.entries()) {
      const gotRow = got.rows[r]
      assert.ok(Array.isArray(gotRow), `fixture ${i} sheet ${s} row ${r}: list required`)
      assert.equal(gotRow.length, row.length, `fixture ${i} sheet ${s} row ${r}: number of cells`)
      for (const [c, value] of row.entries()) assert.ok(same(gotRow[c], value), `fixture ${i} sheet ${s} cell ${colName(c)}${r + 1}: got ${JSON.stringify(gotRow[c])}, want ${JSON.stringify(value)}`)
    }
  }
}
// The check can fail: an empty answer, sheet names alone, and a text-only reading of a string cell are all rejected.
assert.throws(() => verifyOne(0, []))
assert.throws(() => verifyOne(0, books[0].map(({ name }) => ({ name, rows: [] }))))
assert.throws(() => verifyOne(0, books[0].map(({ name, rows }) => ({ name, rows: rows.map((row) => row.map(String)) }))))
assert.throws(() => verifyOne(0, books[0].map(({ name, rows }) => ({ name, rows: rows.slice(0, -1) }))))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  outputs.forEach((output, i) => verifyOne(i, output))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
