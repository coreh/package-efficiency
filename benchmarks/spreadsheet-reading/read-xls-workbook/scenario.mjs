import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Deterministic generator (fixed seeds, no Math.random, no clock) for legacy .xls workbooks: BIFF8 records in a "Workbook"
// stream inside an OLE compound file. The scenario writes both itself, so the expected cell values are known without any
// spreadsheet library.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const colName = (c) => { let s = ''; for (c++; c > 0; c = Math.floor((c - 1) / 26)) s = String.fromCharCode(65 + ((c - 1) % 26)) + s; return s }

// ---- BIFF8 records ----
const MAX_RECORD = 8224
const record = (type, body) => { const h = Buffer.alloc(4); h.writeUInt16LE(type, 0); h.writeUInt16LE(body.length, 2); return Buffer.concat([h, body]) }
const u16 = (...v) => { const b = Buffer.alloc(v.length * 2); v.forEach((x, i) => b.writeUInt16LE(x, i * 2)); return b }
const u32 = (...v) => { const b = Buffer.alloc(v.length * 4); v.forEach((x, i) => b.writeUInt32LE(x >>> 0, i * 4)); return b }
const wide = (s) => [...s].some((ch) => ch.codePointAt(0) > 255)
const chars = (s, isWide) => (isWide ? Buffer.from(s, 'utf16le') : Buffer.from(s, 'latin1'))
// ShortXLUnicodeString: 1-byte length, flags, characters (Latin-1 when they all fit, UTF-16LE otherwise).
const shortString = (s) => { const w = wide(s); return Buffer.concat([Buffer.from([s.length, w ? 1 : 0]), chars(s, w)]) }
const bof = (dt) => record(0x0809, u16(0x0600, dt, 0x0dbb, 0x07cc, 0, 0, 0x0006, 0))
const eof = () => record(0x000a, Buffer.alloc(0))
const font = () => record(0x0031, Buffer.concat([u16(200, 0, 0x7fff, 400, 0), Buffer.from([0, 0, 0, 0]), shortString('Arial')]))
// XF: 15 style records, then cell records 15 (General) and 16 (built-in number format 14, a date).
const xf = (fmt, style) => record(0x00e0, Buffer.concat([u16(0, fmt, style ? 0xfff5 : 0x0001), Buffer.from([0x20, 0, 0, style ? 0 : 0xf8]), u32(0, 0), u16(0x20c0)]))
const XF_GENERAL = 15, XF_DATE = 16
// SST with CONTINUE records: a string never splits inside its header, and a string whose characters cross a record
// boundary carries on after a one-byte flags field, as the format requires. The splits are counted so the scenario can
// assert that the fixtures exercise them.
const splits = { latin: 0, wide: 0 }
const sst = (strings, total) => {
  const records = []
  let cur = [u32(total, strings.length)], len = 8, type = 0x00fc
  const flush = () => { records.push(record(type, Buffer.concat(cur))); cur = []; len = 0; type = 0x003c }
  for (const s of strings) {
    const w = wide(s), unit = w ? 2 : 1
    if (MAX_RECORD - len < 3 + unit) flush()
    cur.push(u16(s.length), Buffer.from([w ? 1 : 0])); len += 3
    let data = chars(s, w)
    while (data.length) {
      const room = Math.floor((MAX_RECORD - len) / unit) * unit
      if (room === 0) { flush(); cur.push(Buffer.from([w ? 1 : 0])); len = 1; splits[w ? 'wide' : 'latin']++; continue }
      const part = data.subarray(0, room)
      cur.push(part); len += part.length; data = data.subarray(part.length)
    }
  }
  flush()
  return records
}
const isDate = (v) => typeof v === 'object' && v !== null && 'date' in v
const biff = (sheets) => {
  const strings = [], index = new Map()
  let total = 0
  const ref = (s) => { total++; if (!index.has(s)) { index.set(s, strings.length); strings.push(s) } return index.get(s) }
  const sheetStreams = sheets.map(({ rows }, n) => {
    const out = [bof(0x0010), record(0x0200, Buffer.concat([u32(0, rows.length), u16(0, rows[0].length, 0)]))]
    // Rows in blocks of 32, as Excel writes them: the ROW records of a block, then its cells.
    for (let start = 0; start < rows.length; start += 32) {
      const block = rows.slice(start, start + 32)
      block.forEach((row, k) => out.push(record(0x0208, u16(start + k, 0, row.length, 0x00ff, 0, 0, 0x0100, 0x000f))))
      block.forEach((row, k) => row.forEach((v, c) => {
        const r = start + k
        if (typeof v === 'string') out.push(record(0x00fd, Buffer.concat([u16(r, c, XF_GENERAL), u32(ref(v))])))
        else if (typeof v === 'boolean') out.push(record(0x0205, Buffer.concat([u16(r, c, XF_GENERAL), Buffer.from([v ? 1 : 0, 0])])))
        else if (isDate(v)) out.push(record(0x027e, Buffer.concat([u16(r, c, XF_DATE), u32((v.date << 2) | 2)])))
        else if (Number.isInteger(v) && Math.abs(v) < 2 ** 29) out.push(record(0x027e, Buffer.concat([u16(r, c, XF_GENERAL), u32((v << 2) | 2)])))
        else { const b = Buffer.alloc(8); b.writeDoubleLE(v); out.push(record(0x0203, Buffer.concat([u16(r, c, XF_GENERAL), b]))) }
      }))
    }
    out.push(record(0x023e, Buffer.concat([u16(n === 0 ? 0x06b6 : 0x04b6, 0, 0), u32(64), u16(0, 0), u32(0)])), eof())
    return Buffer.concat(out)
  })
  const head = [bof(0x0005), record(0x0042, u16(1200)), record(0x003d, u16(0, 0, 0x3000, 0x2000, 0x0038, 0, 0, 1, 0x0258)), record(0x0022, u16(0))]
  for (let i = 0; i < 5; i++) head.push(font())
  for (let i = 0; i < 15; i++) head.push(xf(0, true))
  head.push(xf(0, false), xf(14, false), record(0x0293, Buffer.concat([u16(0x8000), Buffer.from([0, 0xff])])))
  const bounds = sheets.map(({ name }) => Buffer.concat([u32(0), Buffer.from([0, 0]), shortString(name)]))
  const tail = [...sst(strings, total), eof()]
  const boundLen = bounds.reduce((n, b) => n + 4 + b.length, 0)
  let offset = Buffer.concat(head).length + boundLen + Buffer.concat(tail).length
  for (const [i, b] of bounds.entries()) { b.writeUInt32LE(offset, 0); offset += sheetStreams[i].length }
  return Buffer.concat([...head, ...bounds.map((b) => record(0x0085, b)), ...tail, ...sheetStreams])
}

// ---- OLE compound file (version 3, 512-byte sectors) holding one stream, "Workbook" ----
const ENDOFCHAIN = 0xfffffffe, FREESECT = 0xffffffff, FATSECT = 0xfffffffd, NOSTREAM = 0xffffffff
const cfb = (stream) => {
  assert.ok(stream.length >= 4096, 'the Workbook stream must be at least 4096 bytes so that it lives in regular sectors')
  const dataSectors = Math.ceil(stream.length / 512)
  let fatSectors = 1
  while (Math.ceil((dataSectors + 1 + fatSectors) / 128) > fatSectors) fatSectors++
  assert.ok(fatSectors <= 109)
  const dirSector = dataSectors, firstFat = dataSectors + 1
  const fat = Buffer.alloc(fatSectors * 512, 0xff)
  for (let i = 0; i < dataSectors; i++) fat.writeUInt32LE(i === dataSectors - 1 ? ENDOFCHAIN : i + 1, i * 4)
  fat.writeUInt32LE(ENDOFCHAIN, dirSector * 4)
  for (let i = 0; i < fatSectors; i++) fat.writeUInt32LE(FATSECT, (firstFat + i) * 4)
  const entry = (name, type, child, start, size) => {
    const e = Buffer.alloc(128)
    if (name) { e.write(name, 0, 'utf16le'); e.writeUInt16LE((name.length + 1) * 2, 64) }
    e[66] = type; e[67] = 1
    e.writeUInt32LE(NOSTREAM, 68); e.writeUInt32LE(NOSTREAM, 72); e.writeUInt32LE(child, 76)
    e.writeUInt32LE(start, 116); e.writeUInt32LE(size, 120)
    return e
  }
  const dir = Buffer.concat([entry('Root Entry', 5, 1, ENDOFCHAIN, 0), entry('Workbook', 2, NOSTREAM, 0, stream.length), entry('', 0, NOSTREAM, 0, 0), entry('', 0, NOSTREAM, 0, 0)])
  const header = Buffer.alloc(512)
  Buffer.from('d0cf11e0a1b11ae1', 'hex').copy(header, 0)
  header.writeUInt16LE(0x003e, 24); header.writeUInt16LE(0x0003, 26); header.writeUInt16LE(0xfffe, 28); header.writeUInt16LE(9, 30); header.writeUInt16LE(6, 32)
  header.writeUInt32LE(fatSectors, 44); header.writeUInt32LE(dirSector, 48); header.writeUInt32LE(4096, 56)
  header.writeUInt32LE(ENDOFCHAIN, 60); header.writeUInt32LE(0, 64); header.writeUInt32LE(ENDOFCHAIN, 68); header.writeUInt32LE(0, 72)
  for (let i = 0; i < 109; i++) header.writeUInt32LE(i < fatSectors ? firstFat + i : FREESECT, 76 + i * 4)
  const padded = Buffer.alloc(dataSectors * 512); stream.copy(padded)
  return Buffer.concat([header, padded, dir, fat])
}

// ---- Cell values ----
const words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'Ünïcödé', 'naïve café', 'Tom & Jerry', '5 < 6 > 4', 'say "hi"', "it's", '日本語のテキスト', 'line one', 'north', 'south', 'east', 'west', 'Ελληνικά', 'emoji 😀 ok']
// Cells are strings (always containing a letter), whole numbers, decimals that need up to 17 digits to round-trip,
// booleans, or dates (a whole-day serial in the 1900 date system, formatted with built-in number format 14).
// Every row of a sheet has the same number of cells, and none is empty.
const makeCell = (r, kind, row, col) => {
  switch (kind) {
    case 'text': return `${words[(r() * words.length) | 0]} ${(r() * 40) | 0}x`
    case 'word': return words[(r() * words.length) | 0]
    case 'id': return row + 1000
    case 'int': return ((r() * 2000000) | 0) - 1000000
    case 'big': return ((r() * 2 ** 31) | 0) * 4 + 1
    case 'dec': return Number((r() * 10000 - 5000).toFixed(3)) + (col % 2 ? 0.5 : 0.125)
    case 'frac': return r() * 1000 - 500
    case 'bool': return r() < 0.5
    case 'date': return { date: 36526 + ((r() * 12000) | 0) }
    case 'long': return `long ${row}-${col} ` + words[(r() * words.length) | 0].repeat(100)
    default: return `unique-${row}-${col}-${(r() * 1e6) | 0}`
  }
}
const layouts = [
  ['id', 'word', 'int', 'dec', 'bool', 'text', 'date', 'frac', 'unique'],
  ['id', 'text', 'date', 'int', 'dec', 'bool', 'big', 'long'],
  ['word', 'dec', 'frac', 'int', 'big', 'bool', 'unique', 'id', 'date', 'dec'],
]
const specs = [
  { seed: 11, sheets: [['Summary', 3, 6], ['Données & Notes', 40, 7], ['日本語', 30, 5]] },
  { seed: 23, sheets: [['Sheet1', 200, 8], ['Q1 <draft>', 200, 6], ['Q2', 150, 9], ['Totals', 40, 10]] },
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
const files = books.map((sheets) => cfb(biff(sheets)))
assert.ok(splits.latin > 0 && splits.wide > 0, 'the shared string table must split both kinds of string across CONTINUE records')
// An input is the .xls file as a lowercase hex string; each adapter turns it into bytes in its untimed prepare step.
export const cases = files.map((f) => ({ input: f.toString('hex') }))

// ---- Verifier ----
// An output is a list of sheets in workbook order, each { name, rows }: rows is a list of rows, each a list of cell values.
// A library that only returns text for a cell may hand a number as its decimal text ("12.5") or a boolean as "TRUE"/"FALSE", or as the stored 1/0 (number or text), when it has no boolean type.
// A date may come back as its serial (number or text) or as the ISO date of that serial, with or without a midnight time.
// A string cell must come back as a string, exactly.
const isoDate = (serial) => new Date(Date.UTC(1899, 11, 30) + serial * 86400000).toISOString().slice(0, 10)
const same = (got, want) => {
  if (typeof want === 'string') return got === want
  if (typeof want === 'boolean') return got === want || [want ? 1 : 0, want ? '1' : '0', want ? 'TRUE' : 'FALSE'].includes(got)
  if (isDate(want)) { const d = isoDate(want.date); return got === want.date || got === String(want.date) || got === d || got === `${d}T00:00:00` || got === `${d} 00:00:00` }
  return got === want || got === String(want)
}
const show = (v) => (isDate(v) ? `date ${v.date} (${isoDate(v.date)})` : JSON.stringify(v))
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
      for (const [c, value] of row.entries()) assert.ok(same(gotRow[c], value), `fixture ${i} sheet ${s} cell ${colName(c)}${r + 1}: got ${JSON.stringify(gotRow[c])}, want ${show(value)}`)
    }
  }
}
// The check can fail: an empty answer, sheet names alone, truncated rows, a text-only reading of a string cell,
// numbers rounded to 15 significant digits and dates one day off are all rejected.
const plain = (v) => (isDate(v) ? v.date : v)
assert.throws(() => verifyOne(0, []))
assert.throws(() => verifyOne(0, books[0].map(({ name }) => ({ name, rows: [] }))))
assert.throws(() => verifyOne(0, books[0].map(({ name, rows }) => ({ name, rows: rows.map((row) => row.map((v) => String(plain(v)))) }))))
assert.throws(() => verifyOne(0, books[0].map(({ name, rows }) => ({ name, rows: rows.slice(0, -1) }))))
assert.throws(() => verifyOne(0, books[0].map(({ name, rows }) => ({ name, rows: rows.map((row) => row.map((v) => (typeof v === 'number' ? Number(v.toPrecision(15)) : plain(v)))) }))))
assert.throws(() => verifyOne(0, books[0].map(({ name, rows }) => ({ name, rows: rows.map((row) => row.map((v) => (isDate(v) ? v.date + 1 : v))) }))))
verifyOne(0, books[0].map(({ name, rows }) => ({ name, rows: rows.map((row) => row.map(plain)) })))
verifyOne(0, books[0].map(({ name, rows }) => ({ name, rows: rows.map((row) => row.map((v) => (isDate(v) ? isoDate(v.date) : v))) })))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  outputs.forEach((output, i) => verifyOne(i, output))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
