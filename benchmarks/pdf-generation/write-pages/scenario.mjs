import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { deflateSync, inflateSync } from 'node:zlib'

// An input is a document of 20 A4 pages (595.28 by 841.89 points). A page is
//   { texts: [{ x, y, text }], rules: [[x1, y1, x2, y2]] }
// Coordinates are points from the TOP-LEFT corner of the page, y downward. A
// text is drawn in Helvetica 10 pt with its baseline start at (x, y). The
// texts are the page's lines followed by the cells of its table, row by row;
// the rules are the ruled table's horizontal and vertical lines. The scenario
// writes the data; no library is consulted.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
export const PAGE_WIDTH = 595.28
export const PAGE_HEIGHT = 841.89
const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu', 'report', 'section', 'total', 'value', 'Invoice', 'Chapter', 'Summary', 'Notes', 'Q3', '2026', '1,250.00', '42', '7.5', 'item-12', 'A/B', 'f(x)', '(draft)', 'a\\b', 'café', 'señor', 'über', 'naïve', 'São', 'Ångström', '50%', '#7', '"quoted"', "it's", 'a&b', 'x<y', '[ok]']
const sentence = (r, n) => Array.from({ length: n }, () => words[(r() * words.length) | 0]).join(' ')
// [text lines per page, table rows, table columns, seed]
const shapes = [[28, 8, 3, 11], [36, 10, 4, 23], [40, 11, 5, 37], [22, 14, 4, 53]]
const build = ([lineCount, rows, cols, seed]) => {
  const r = rng(seed), pages = []
  for (let p = 0; p < 20; p++) {
    const texts = [], rules = []
    texts.push({ x: 56.5, y: 60, text: `Report ${seed}, page ${p + 1} of 20` })
    for (let i = 1; i < lineCount; i++) texts.push({ x: 56.5 + (i % 3) * 6.25, y: 60 + i * 11.5, text: `${i}. ${sentence(r, 5 + ((r() * 8) | 0))}` })
    // The table: below the lines, columns of 100 points, rows of 18.
    const left = 56.5, top = 60 + lineCount * 11.5 + 20, colW = 100, rowH = 18
    for (let i = 0; i <= rows; i++) rules.push([left, top + i * rowH, left + cols * colW, top + i * rowH])
    for (let j = 0; j <= cols; j++) rules.push([left + j * colW, top, left + j * colW, top + rows * rowH])
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) texts.push({ x: left + j * colW + 4, y: top + i * rowH + 12.5, text: `${words[(r() * words.length) | 0]} ${p + 1}.${i}.${j}` })
    assert.ok(top + rows * rowH < PAGE_HEIGHT - 40, 'the table fits on the page')
    pages.push({ texts, rules })
  }
  return { pages }
}
export const cases = shapes.map((s) => ({ input: build(s) }))

// ---- A reader for the check: the structure of a PDF, no library involved.
const text = (buf) => buf.toString('latin1')
// ASCII85, as reportlab writes by default before Flate.
const ascii85 = (s) => {
  s = s.replace(/\s+/g, '')
  assert.ok(s.endsWith('~>'), 'ASCII85 data without its end marker')
  s = s.slice(0, -2)
  const out = []
  let group = [], i = 0
  const flush = (g, n) => {
    let v = 0
    for (let k = 0; k < 5; k++) v = v * 85 + (g[k] ?? 84)
    const bytes = [Math.floor(v / 16777216) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]
    out.push(...bytes.slice(0, n - 1))
  }
  for (; i < s.length; i++) {
    const c = s[i]
    if (c === 'z' && group.length === 0) { out.push(0, 0, 0, 0); continue }
    const d = s.charCodeAt(i) - 33
    assert.ok(d >= 0 && d < 85, 'bad ASCII85 character')
    group.push(d)
    if (group.length === 5) { flush(group, 5); group = [] }
  }
  if (group.length) { assert.ok(group.length > 1, 'bad ASCII85 tail'); const n = group.length; flush(group, n) }
  return Buffer.from(out)
}
// The value of a direct integer object `num gen obj <n> endobj`, for an indirect /Length.
const integerObject = (s, num, gen) => {
  const m = new RegExp(`(?:^|[^0-9])${num}\\s+${gen}\\s+obj\\s*(\\d+)\\s*endobj`).exec(s)
  return m ? Number(m[1]) : null
}
// Where a stream's data ends. The data is followed by an end-of-line marker that is not
// part of it, then `endstream` (ISO 32000-1, 7.3.8.1). /Length, direct or indirect, gives
// the end; the bytes after it up to `endstream` may only be white space. Without a usable
// /Length, the data ends before `endstream` less at most one EOL (CRLF, LF or CR): any
// other CR or LF before it belongs to the data.
const streamEnd = (s, dict, from) => {
  const direct = /\/Length\s+(\d+)(?!\d)(?!\s+\d+\s+R)/.exec(dict)
  const indirect = /\/Length\s+(\d+)\s+(\d+)\s+R/.exec(dict)
  const length = direct ? Number(direct[1]) : indirect ? integerObject(s, indirect[1], indirect[2]) : null
  if (length !== null && from + length <= s.length && /^[\0\t\n\f\r ]*endstream/.test(s.slice(from + length, from + length + 64))) return from + length
  const at = s.indexOf('endstream', from)
  assert.ok(at >= from, 'a stream without endstream')
  if (s.slice(at - 2, at) === '\r\n' && at - 2 >= from) return at - 2
  if ((s[at - 1] === '\n' || s[at - 1] === '\r') && at - 1 >= from) return at - 1
  return at
}
// Objects: number -> { dict: text, stream: Buffer | null }
const parseObjects = (file) => {
  const s = text(file), objects = new Map()
  const re = /(\d+)\s+(\d+)\s+obj\b/g
  let m
  while ((m = re.exec(s))) {
    const num = Number(m[1]), start = m.index + m[0].length
    const end = s.indexOf('endobj', start)
    assert.ok(end > 0, `object ${num} is not closed`)
    const body = s.slice(start, end)
    const sp = body.search(/stream\r?\n/)
    if (sp >= 0 && !/^\s*[\[(]/.test(body.slice(0, sp))) {
      const dict = body.slice(0, sp)
      let from = start + sp + body.slice(sp).match(/stream\r?\n/)[0].length
      const to = streamEnd(s, dict, from)
      objects.set(num, { dict, stream: file.subarray(from, to) })
      re.lastIndex = Math.max(re.lastIndex, to)
    } else objects.set(num, { dict: body, stream: null })
  }
  return objects
}
const decodeStream = (obj, where) => {
  let data = obj.stream
  const f = /\/Filter\s*(\[[^\]]*\]|\/\w+)/.exec(obj.dict)
  const filters = f ? [...f[1].matchAll(/\/(\w+)/g)].map((x) => x[1]) : []
  for (const name of filters) {
    if (name === 'FlateDecode' || name === 'Fl') data = inflateSync(data)
    else if (name === 'ASCII85Decode' || name === 'A85') data = ascii85(text(data))
    else assert.fail(`${where}: unsupported stream filter ${name}`)
  }
  return data
}
// Objects packed in object streams join the table.
const addObjectStreams = (objects) => {
  for (const [num, obj] of [...objects]) {
    if (!obj.stream || !/\/Type\s*\/ObjStm\b/.test(obj.dict)) continue
    const data = text(decodeStream(obj, `object ${num}`))
    const n = Number(/\/N\s+(\d+)/.exec(obj.dict)[1]), first = Number(/\/First\s+(\d+)/.exec(obj.dict)[1])
    const head = data.slice(0, first).trim().split(/\s+/).map(Number)
    for (let k = 0; k < n; k++) {
      const from = first + head[2 * k + 1], to = k + 1 < n ? first + head[2 * k + 3] : data.length
      objects.set(head[2 * k], { dict: data.slice(from, to), stream: null })
    }
  }
}
const refOf = (s) => { const m = /^\s*(\d+)\s+\d+\s+R\b/.exec(s); return m ? Number(m[1]) : null }
const entry = (dict, key) => { // the raw value after /Key, an array or a token
  const m = new RegExp(`/${key}(?![A-Za-z])\\s*`).exec(dict)
  if (!m) return null
  const rest = dict.slice(m.index + m[0].length)
  if (rest[0] === '[') return rest.slice(0, rest.indexOf(']') + 1)
  return rest
}
// Page tree, in order. Inherits MediaBox.
const readPages = (objects) => {
  const catalogs = [...objects.values()].filter((o) => /\/Type\s*\/Catalog\b/.test(o.dict))
  assert.equal(catalogs.length, 1, 'exactly one catalog is required')
  const root = refOf(entry(catalogs[0].dict, 'Pages'))
  assert.ok(root !== null, 'the catalog has no /Pages')
  const out = []
  const walk = (num, inherited, depth) => {
    assert.ok(depth < 20, 'page tree too deep')
    const obj = objects.get(num)
    assert.ok(obj, `missing page tree object ${num}`)
    const mb = entry(obj.dict, 'MediaBox')
    const box = mb && mb.startsWith('[') ? mb : inherited
    if (/\/Type\s*\/Pages\b/.test(obj.dict)) {
      const kids = entry(obj.dict, 'Kids')
      assert.ok(kids && kids.startsWith('['), 'a /Pages node without /Kids')
      for (const k of kids.matchAll(/(\d+)\s+\d+\s+R/g)) walk(Number(k[1]), box, depth + 1)
    } else {
      assert.ok(/\/Type\s*\/Page\b/.test(obj.dict), `object ${num} is neither a page nor a page tree node`)
      out.push({ num, obj, box })
    }
  }
  walk(root, null, 0)
  return out
}
// The content-stream tokenizer: strings (literal and hex), arrays, names,
// numbers and operators. Inline images are not read (the fixtures have none).
const tokenize = (s) => {
  const toks = []
  let i = 0
  const ws = /[\s\0]/
  const delim = '()<>[]{}/%'
  while (i < s.length) {
    const c = s[i]
    if (ws.test(c)) { i++; continue }
    if (c === '%') { while (i < s.length && s[i] !== '\n' && s[i] !== '\r') i++; continue }
    if (c === '(') {
      let depth = 1, out = ''
      i++
      while (i < s.length && depth > 0) {
        const d = s[i]
        if (d === '\\') {
          const e = s[i + 1]
          if (e >= '0' && e <= '7') { let o = e, k = 2; while (k < 4 && s[i + k] >= '0' && s[i + k] <= '7') o += s[i + k++]; out += String.fromCharCode(parseInt(o, 8) & 255); i += k; continue }
          if (e === '\r') { i += s[i + 2] === '\n' ? 3 : 2; continue }
          if (e === '\n') { i += 2; continue }
          out += { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' }[e] ?? e
          i += 2; continue
        }
        if (d === '(') depth++
        else if (d === ')') { depth--; if (depth === 0) { i++; break } }
        out += d; i++
      }
      assert.equal(depth, 0, 'unterminated string in a content stream')
      toks.push({ t: 'str', v: out }); continue
    }
    if (c === '<' && s[i + 1] !== '<') {
      const end = s.indexOf('>', i)
      assert.ok(end > 0, 'unterminated hex string')
      let hex = s.slice(i + 1, end).replace(/\s+/g, '')
      assert.ok(/^[0-9a-fA-F]*$/.test(hex), 'bad hex string')
      if (hex.length % 2) hex += '0'
      toks.push({ t: 'str', v: Buffer.from(hex, 'hex').toString('latin1'), hex: true }); i = end + 1; continue
    }
    if (c === '<' || c === '>') { toks.push({ t: 'op', v: s.slice(i, i + 2) }); i += 2; continue }
    if (c === '[' || c === ']') { toks.push({ t: c }); i++; continue }
    if (c === '/') { let j = i + 1; while (j < s.length && !ws.test(s[j]) && !delim.includes(s[j])) j++; toks.push({ t: 'name', v: s.slice(i + 1, j) }); i = j; continue }
    let j = i
    while (j < s.length && !ws.test(s[j]) && !delim.includes(s[j])) j++
    if (j === i) { i++; continue }
    const w = s.slice(i, j)
    toks.push(/^[+-]?(\d+\.?\d*|\.\d+)$/.test(w) ? { t: 'num', v: Number(w) } : { t: 'op', v: w })
    i = j
  }
  return toks
}
// What a page shows: lines of text (each a positioned run, kerning arrays
// joined) and how many line segments it draws and strokes.
const readContentFull = (content) => {
  const toks = tokenize(content)
  const lines = []
  let current = null, segments = 0, strokes = 0, operands = [], arr = null
  const show = (str) => { if (current === null) { current = ''; lines.push(0) } current += str }
  const end = () => { if (current !== null) { lines[lines.length - 1] = current; current = null } }
  for (const tk of toks) {
    if (tk.t === '[') { arr = []; continue }
    if (tk.t === ']') { operands.push({ t: 'arr', v: arr }); arr = null; continue }
    if (tk.t === 'str' || tk.t === 'num' || tk.t === 'name') { (arr ?? operands).push(tk); continue }
    if (tk.t !== 'op') continue
    const op = tk.v, last = operands.at(-1)
    if (op === 'Tj') { assert.equal(last?.t, 'str', 'Tj without a string'); show(last.v) }
    else if (op === 'TJ') { assert.equal(last?.t, 'arr', 'TJ without an array'); for (const e of last.v) if (e.t === 'str') show(e.v) }
    else if (op === "'" || op === '"') { assert.equal(last?.t, 'str', `${op} without a string`); end(); show(last.v) }
    else if (['BT', 'ET', 'Td', 'TD', 'Tm', 'T*'].includes(op)) end()
    else if (op === 'l') segments++
    else if (op === 're') segments += 4
    else if (['S', 's', 'B', 'b', 'B*', 'b*'].includes(op)) strokes++
    operands = []
  }
  end()
  return { lines: lines.filter((l) => l !== ''), segments, strokes }
}
export const readPdf = (file) => {
  assert.ok(file.length > 200, 'too short to be a PDF')
  assert.ok(text(file.subarray(0, 8)).startsWith('%PDF-1.') || text(file.subarray(0, 8)).startsWith('%PDF-2.'), 'no %PDF- header')
  assert.ok(text(file.subarray(Math.max(0, file.length - 64))).includes('%%EOF'), 'no %%EOF trailer')
  const objects = parseObjects(file)
  addObjectStreams(objects)
  return readPages(objects).map(({ num, obj, box }) => {
    assert.ok(box && box.startsWith('['), `page object ${num} has no MediaBox`)
    const v = box.slice(1, -1).trim().split(/\s+/).map(Number)
    assert.ok(v.length === 4 && v.every(Number.isFinite), `page object ${num}: bad MediaBox`)
    const c = entry(obj.dict, 'Contents')
    assert.ok(c, `page object ${num} has no /Contents`)
    const refs = c.startsWith('[') ? [...c.matchAll(/(\d+)\s+\d+\s+R/g)].map((m) => Number(m[1])) : [refOf(c)]
    const content = refs.map((r) => {
      const o = objects.get(r)
      assert.ok(o && o.stream, `page object ${num}: content stream ${r} is missing`)
      return text(decodeStream(o, `content stream ${r}`))
    }).join('\n')
    return { width: v[2] - v[0], height: v[3] - v[1], ...readContentFull(content) }
  })
}

const bytesOf = (out) => typeof out === 'string' ? Buffer.from(out, 'base64') : out instanceof ArrayBuffer ? Buffer.from(out) : Buffer.from(out.buffer, out.byteOffset, out.byteLength)
export const SIZE_TOLERANCE = 1
export const checkPdf = (file, input, label) => {
  const pages = readPdf(file)
  assert.equal(pages.length, input.pages.length, `${label}: page count`)
  pages.forEach((got, p) => {
    const want = input.pages[p]
    assert.ok(Math.abs(got.width - PAGE_WIDTH) <= SIZE_TOLERANCE && Math.abs(got.height - PAGE_HEIGHT) <= SIZE_TOLERANCE, `${label}: page ${p + 1} is ${got.width} by ${got.height} points, not A4`)
    const expected = want.texts.map((t) => t.text)
    assert.equal(got.lines.length, expected.length, `${label}: page ${p + 1}: ${got.lines.length} lines of text, ${expected.length} expected`)
    expected.forEach((line, k) => assert.equal(got.lines[k], line, `${label}: page ${p + 1}, line ${k}`))
    assert.ok(got.segments >= want.rules.length, `${label}: page ${p + 1}: ${got.segments} line segments drawn, ${want.rules.length} rules expected`)
    assert.ok(got.strokes >= 1, `${label}: page ${p + 1}: nothing is stroked`)
  })
}
export const verifyOne = (i, output) => {
  assert.ok(typeof output === 'string' || ArrayBuffer.isView(output) || output instanceof ArrayBuffer, `fixture ${i}: PDF bytes (or their base64 text) are required`)
  checkPdf(bytesOf(output), cases[i].input, `fixture ${i}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length ?? value.byteLength

// ---- The proof that the check can fail: a minimal writer of the scenario's
// own, then outputs that did not do the job.
// It writes what the specification asks for: an EOL after `stream` and before `endstream`
// that /Length does not count, a cross-reference table with each object's offset, and a
// trailer with /Size, /Root and startxref. `length: 'indirect'` writes /Length as a
// reference to an integer object; `length: 'none'` leaves it out, for the reader's fallback.
const miniContent = (pg, { drop = null, rules = true } = {}) => {
  const esc = (s) => s.replace(/[\\()]/g, '\\$&')
  let c = 'BT /F1 10 Tf\n'
  pg.texts.forEach((t, j) => { if (drop === j) return; c += `1 0 0 1 ${t.x} ${PAGE_HEIGHT - t.y} Tm (${esc(t.text)}) Tj\n` })
  c += 'ET\n0.5 w\n'
  if (rules) for (const [x1, y1, x2, y2] of pg.rules) c += `${x1} ${PAGE_HEIGHT - y1} m ${x2} ${PAGE_HEIGHT - y2} l S\n`
  return c
}
const miniPdf = (input, { drop = null, pagesWanted = input.pages.length, size = [PAGE_WIDTH, PAGE_HEIGHT], rules = true, swap = false, compress = 'flate', length = 'direct', eol = '\n' } = {}) => {
  const list = input.pages.slice(0, pagesWanted)
  if (swap) [list[0], list[1]] = [list[1], list[0]]
  const objs = []
  const n = list.length
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objs[2] = `<< /Type /Pages /Count ${n} /Kids [${list.map((_, k) => `${4 + 2 * k} 0 R`).join(' ')}] >>`
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  list.forEach((pg, k) => {
    const raw = Buffer.from(miniContent(pg, { drop, rules }), 'latin1')
    const data = compress === 'flate' ? deflateSync(raw) : raw
    objs[4 + 2 * k] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${size[0]} ${size[1]}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + 2 * k} 0 R >>`
    const lengthEntry = length === 'direct' ? ` /Length ${data.length}` : length === 'indirect' ? ` /Length ${4 + 2 * n + k} 0 R` : ''
    objs[5 + 2 * k] = { dict: `<<${lengthEntry}${compress === 'flate' ? ' /Filter /FlateDecode' : ''} >>`, data }
    if (length === 'indirect') objs[4 + 2 * n + k] = String(data.length)
  })
  // A binary comment after the header, as the specification recommends for binary data.
  const parts = [Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', 'latin1')]
  let offset = parts[0].length
  const offsets = []
  for (let k = 1; k < objs.length; k++) {
    const o = objs[k]
    const bytes = typeof o === 'string' ? Buffer.from(`${k} 0 obj\n${o}\nendobj\n`, 'latin1') : Buffer.concat([Buffer.from(`${k} 0 obj\n${o.dict}\nstream${eol}`), o.data, Buffer.from(`${eol}endstream\nendobj\n`)])
    offsets[k] = offset
    offset += bytes.length
    parts.push(bytes)
  }
  const xref = `xref\n0 ${objs.length}\n0000000000 65535 f\r\n${offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n\r\n`).join('')}`
  parts.push(Buffer.from(`${xref}trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`, 'latin1'))
  return Buffer.concat(parts)
}
{
  const input = cases[0].input
  checkPdf(miniPdf(input), input, 'self-test')
  checkPdf(miniPdf(input, { compress: 'none' }), input, 'self-test (uncompressed)')
  checkPdf(miniPdf(input, { eol: '\r\n' }), input, 'self-test (CRLF)')
  checkPdf(miniPdf(input, { length: 'indirect' }), input, 'self-test (indirect /Length)')
  // Some deflate streams of these pages end in a CR or LF byte (page 3 of fixture 0 in CR):
  // /Length must be honoured, and the fallback must strip only the one EOL. Without /Length,
  // data ending in CR followed by an LF marker reads as a CRLF marker; that is why /Length
  // is required, so the fallback is tested with CRLF markers only.
  const pageData = (pg) => deflateSync(Buffer.from(miniContent(pg), 'latin1'))
  const tails = new Set(cases.flatMap(({ input: doc }) => doc.pages.map((pg) => pageData(pg).at(-1))))
  assert.ok(tails.has(0x0d), 'no fixture page tests a stream that ends in CR')
  for (const { input: doc } of cases) {
    checkPdf(miniPdf(doc), doc, 'self-test (every fixture)')
    checkPdf(miniPdf(doc, { length: 'indirect', eol: '\r\n' }), doc, 'self-test (indirect /Length, CRLF, every fixture)')
    checkPdf(miniPdf(doc, { length: 'none', eol: '\r\n' }), doc, 'self-test (no /Length, CRLF, every fixture)')
  }
  // The old fallback, which trimmed every CR and LF before endstream, fails on that page.
  assert.throws(() => checkPdf(Buffer.from(text(miniPdf(input, { length: 'none' })).replace(/\r?\n+endstream/g, '\nendstream'), 'latin1'), input, 'trimmed'))
  const rejected = (name, file, doc = input) => assert.throws(() => checkPdf(file, doc, name), undefined, `the check accepted ${name}`)
  rejected('a missing line', miniPdf(input, { drop: 3 }))
  rejected('a missing page', miniPdf(input, { pagesWanted: 19 }))
  rejected('swapped pages', miniPdf(input, { swap: true }))
  rejected('Letter size', miniPdf(input, { size: [612, 792] }))
  rejected('no table rules', miniPdf(input, { rules: false }))
  rejected('the input text unchanged', Buffer.from(JSON.stringify(input)))
  rejected('empty output', Buffer.alloc(0))
  const cut = miniPdf(input)
  rejected('a truncated file', cut.subarray(0, cut.length - 200))
  // Another document's text under this document's page structure is not accepted either.
  rejected('another fixture', miniPdf(cases[1].input), input)
}
