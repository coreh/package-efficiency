import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { inflateRawSync } from 'node:zlib'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const pick = (r, a) => a[Math.floor(r() * a.length)]
const texts = ['alpha', 'Bravo Charlie', 'R&D <lab>', 'say "hi" & \'bye\'', 'café São Paulo', '日本語のテキスト', 'Привет мир', '007', '1e5', '12.50', '😀 emoji', 'a > b', 'x'.repeat(120), 'ünïcödé', '-5', 'TRUE']
const ints = (r) => Math.floor(r() * 2000000) - 1000000
const money = (r) => (Math.floor(r() * 10000000) - 2000000) / 100
const small = (r) => Math.floor(r() * 100)
const ratio = (r) => Math.round(r() * 1000000) / 1000000
const cellKinds = [(r) => pick(r, texts), ints, money, small, ratio, (r) => 'id-' + Math.floor(r() * 100000), (r) => pick(r, texts) + ' ' + small(r), money]
// [sheet names, rows, columns]
const shapes = [
  [['Data'], 5, 3], [['Sales 2026'], 30, 5], [['Q1', 'Q2'], 20, 4], [['Users', 'Orders', 'R&D'], 40, 6], [['Wide'], 15, 8],
  [['Tall'], 250, 3], [['One', 'Two', 'Three'], 100, 7], [['Mixed'], 60, 6], [['Ünï çödé', 'Plain'], 25, 4], [['Report'], 120, 8],
]
export const cases = shapes.map(([names, rowCount, cols], k) => {
  const r = rng(9100 + k)
  const kinds = Array.from({ length: cols }, (_, c) => cellKinds[(c + k) % cellKinds.length])
  const sheets = names.map((name, s) => ({
    name,
    rows: [Array.from({ length: cols }, (_, c) => `Column ${c + 1}`)].concat(
      Array.from({ length: rowCount + s * 3 }, () => kinds.map((f) => f(r)))),
  }))
  return { input: { sheets }, expected: sheets }
})

// ---- A strict reader for the parts of XLSX (ZIP + SpreadsheetML) a consumer needs ----
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const unzip = (buf) => {
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  assert.ok(eocd >= 0, 'not a ZIP file: no end of central directory')
  const count = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  const files = new Map()
  for (let n = 0; n < count; n++) {
    assert.equal(buf.readUInt32LE(p), 0x02014b50, 'bad central directory entry')
    const method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24)
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32), local = buf.readUInt32LE(p + 42)
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen)
    p += 46 + nameLen + extraLen + commentLen
    assert.equal(buf.readUInt32LE(local), 0x04034b50, `bad local header for ${name}`)
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
    const raw = buf.subarray(start, start + csize)
    assert.equal(raw.length, csize, `${name}: truncated`)
    assert.ok(method === 0 || method === 8, `${name}: compression method ${method}`)
    const data = method === 8 ? inflateRawSync(raw) : raw
    assert.equal(data.length, usize, `${name}: size`)
    assert.equal(crc32(data), crc, `${name}: CRC-32`)
    assert.ok(!files.has(name), `${name}: duplicate entry`)
    files.set(name, Buffer.from(data))
  }
  return files
}
const unescapeXml = (s) => s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g, (_, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e])
const noStrayAmp = (s, what) => assert.ok(!/&(?!#x[0-9a-fA-F]+;|#[0-9]+;|amp;|lt;|gt;|quot;|apos;)/.test(s) && !/<(?![\/a-zA-Z?!])/.test(s), `${what}: malformed XML`)
const attrs = (tag) => { const out = {}; for (const m of tag.matchAll(/([\w:]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) out[m[1]] = unescapeXml(m[2] ?? m[3]); return out }
const textOf = (xml) => { // all <t> runs of an <si> or <is>, excluding phonetic runs
  const noPh = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '')
  return [...noPh.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g)].map((m) => unescapeXml(m[1] ?? '')).join('')
}
const colIndex = (letters) => letters.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1
export const readWorkbook = (bytes) => {
  const buf = Buffer.from(bytes)
  const files = unzip(buf)
  const text = (name) => { assert.ok(files.has(name), `missing ${name}`); const s = files.get(name).toString('utf8'); noStrayAmp(s, name); return s }
  const rootRels = text('_rels/.rels'), wbPath = (() => { const t = [...rootRels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => attrs(m[0])).find((a) => /officeDocument$/.test(a.Type)); assert.ok(t, 'no officeDocument relationship'); return t.Target.replace(/^\//, '') })()
  const wbDir = wbPath.includes('/') ? wbPath.slice(0, wbPath.lastIndexOf('/') + 1) : ''
  const wb = text(wbPath)
  const rels = new Map([...text(`${wbDir}_rels/${wbPath.slice(wbDir.length)}.rels`).matchAll(/<Relationship\b[^>]*>/g)].map((m) => { const a = attrs(m[0]); return [a.Id, a] }))
  let shared = []
  const sstRel = [...rels.values()].find((a) => /sharedStrings$/.test(a.Type))
  if (sstRel) shared = [...text(sstRel.Target.startsWith('/') ? sstRel.Target.slice(1) : wbDir + sstRel.Target).matchAll(/<si>([\s\S]*?)<\/si>|<si\/>/g)].map((m) => textOf(m[1] ?? ''))
  const sheets = []
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const a = attrs(m[0]), rel = rels.get(a['r:id'])
    assert.ok(rel, `sheet ${a.name}: no relationship`)
    const xml = text(rel.Target.startsWith('/') ? rel.Target.slice(1) : wbDir + rel.Target)
    const cells = new Map()
    for (const c of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ca = attrs(c[1]), body = c[2] ?? ''
      assert.ok(ca.r, 'cell without reference')
      const ref = /^([A-Z]+)([0-9]+)$/.exec(ca.r); assert.ok(ref, `bad cell reference ${ca.r}`)
      assert.ok(!/<f[\s>\/]/.test(body), `${ca.r}: formula`)
      const v = /<v>([\s\S]*?)<\/v>/.exec(body)
      let value
      if (ca.t === 's') { assert.ok(v, `${ca.r}: no value`); const k = Number(v[1]); assert.ok(Number.isInteger(k) && k < shared.length, `${ca.r}: bad shared string index`); value = shared[k] }
      else if (ca.t === 'inlineStr') { const is = /<is>([\s\S]*?)<\/is>/.exec(body); assert.ok(is, `${ca.r}: no inline string`); value = textOf(is[1]) }
      else if (ca.t === 'str') { assert.ok(v, `${ca.r}: no value`); value = unescapeXml(v[1]) }
      else if (ca.t === undefined || ca.t === 'n') { if (!v) continue; assert.match(v[1], /^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/, `${ca.r}: not a number`); value = Number(v[1]) }
      else assert.fail(`${ca.r}: unexpected cell type ${ca.t}`)
      const key = `${Number(ref[2]) - 1},${colIndex(ref[1])}`
      assert.ok(!cells.has(key), `${ca.r}: duplicate cell`)
      cells.set(key, value)
    }
    sheets.push({ name: unescapeXml(a.name), cells })
  }
  return sheets
}
// An output is the file's bytes: a Uint8Array/Buffer (JavaScript), an array of integers (Rust, Python,
// Ruby) or a base64 string (Go's []byte through encoding/json).
const toBytes = (o) => typeof o === 'string' ? Buffer.from(o, 'base64') : Buffer.from(o)
export const verifyOne = (i, output) => {
  const expected = cases[i].expected
  assert.ok(output !== null && output !== undefined && (typeof output === 'string' || output.length > 0), `fixture ${i}: bytes required`)
  const sheets = readWorkbook(toBytes(output))
  assert.deepEqual(sheets.map((s) => s.name), expected.map((s) => s.name), `fixture ${i}: sheet names or order`)
  expected.forEach((sheet, s) => {
    const got = sheets[s].cells
    let count = 0
    sheet.rows.forEach((row, y) => row.forEach((want, x) => {
      count++
      const have = got.get(`${y},${x}`)
      assert.equal(typeof have, typeof want, `fixture ${i} ${sheet.name} r${y + 1}c${x + 1}: type (${JSON.stringify(have)} for ${JSON.stringify(want)})`)
      assert.ok(Object.is(have, want) || have === want, `fixture ${i} ${sheet.name} r${y + 1}c${x + 1}: ${JSON.stringify(have)} for ${JSON.stringify(want)}`)
    }))
    assert.equal(got.size, count, `fixture ${i} ${sheet.name}: ${got.size} cells, expected ${count}`)
  })
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  outputs.forEach((o, i) => verifyOne(i, o))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
