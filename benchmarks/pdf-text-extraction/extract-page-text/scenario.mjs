import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { deflateSync } from 'node:zlib'
// Deterministic small PDFs with known text. The scenario writes the file and
// records the words it put on each page; no library is consulted.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const vocabulary = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu', 'report', 'section', 'total', 'value', 'page', 'table', 'Invoice', 'Chapter', 'Summary', 'Notes', 'Q3', '2026', '1,250.00', '42', '7.5', 'item-12', 'A/B']
const fontNames = ['Helvetica', 'Times-Roman', 'Courier']
const esc = (s) => s.replace(/[\\()]/g, '\\$&')
// [pages, lines per page, words per line, font, compress, drawing style]
const shapes = [[1, 6, 6, 0, false, 0], [1, 30, 8, 1, true, 1], [2, 12, 7, 2, false, 2], [3, 20, 9, 0, true, 0], [4, 25, 10, 1, true, 1], [6, 15, 8, 0, false, 2], [8, 30, 9, 2, true, 0], [12, 35, 11, 1, true, 1]]

const build = (pages, font, compress, style, rand) => {
  const objects = [] // 1-based object bodies as Buffers
  const add = (b) => objects.push(Buffer.isBuffer(b) ? b : Buffer.from(b, 'latin1'))
  const nPages = pages.length
  add('<< /Type /Catalog /Pages 2 0 R >>')
  add(`<< /Type /Pages /Count ${nPages} /Kids [${pages.map((_, i) => `${5 + 2 * i} 0 R`).join(' ')}] >>`)
  add(`<< /Type /Font /Subtype /Type1 /BaseFont /${fontNames[font]} /Encoding /WinAnsiEncoding >>`)
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  pages.forEach((lines, p) => {
    let c = 'BT\n/F1 11 Tf\n14 TL\n56 790 Td\n'
    lines.forEach((words, l) => {
      const text = words.join(' ')
      // Three ways of showing a line: Tj, a TJ array with small kerning, and the ' operator.
      if (style === 0 || l === 0) c += `${l ? 'T* ' : ''}(${esc(text)}) Tj\n`
      else if (style === 1) c += `T*\n[(${esc(words[0])}) -15 (${esc(' ' + words.slice(1).join(' '))})] TJ\n`
      else c += `(${esc(text)}) '\n`
    })
    c += 'ET\n'
    let body = Buffer.from(c, 'latin1'), extra = ''
    if (compress) { body = deflateSync(body); extra = ' /Filter /FlateDecode' }
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + 2 * p} 0 R >>`)
    add(Buffer.concat([Buffer.from(`<< /Length ${body.length}${extra} >>\nstream\n`, 'latin1'), body, Buffer.from('\nendstream', 'latin1')]))
  })
  const parts = [Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', 'latin1')], offsets = []
  let pos = parts[0].length
  objects.forEach((b, i) => {
    offsets.push(pos)
    const part = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`, 'latin1'), b, Buffer.from('\nendobj\n', 'latin1')])
    parts.push(part); pos += part.length
  })
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const o of offsets) xref += `${String(o).padStart(10, '0')} 00000 n \n`
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`
  parts.push(Buffer.from(xref, 'latin1'))
  return Buffer.concat(parts)
}

const fixtures = shapes.map(([nPages, nLines, nWords, font, compress, style], i) => {
  const rand = rng(7 + i)
  const pages = Array.from({ length: nPages }, () => Array.from({ length: nLines }, () => Array.from({ length: nWords }, () => vocabulary[(rand() * vocabulary.length) | 0])))
  return { pdf: build(pages, font, compress, style, rand), words: pages.map((lines) => lines.flat()) }
})
// An input is the file as a lowercase hex string; an adapter turns it into
// bytes in its untimed prepare step.
export const cases = fixtures.map(({ pdf }) => ({ input: pdf.toString('hex') }))

// The output is a list with one string per page, in page order. Each page's
// words (split on any white space) must be exactly the words drawn on it, in order.
const wordsOf = (s) => s.split(/\s+/).filter(Boolean)
export const verifyOne = (i, output) => {
  const { words } = fixtures[i]
  assert.ok(Array.isArray(output) && output.every((p) => typeof p === 'string'), `fixture ${i}: a list of page texts (strings) is required`)
  assert.equal(output.length, words.length, `fixture ${i}: page count`)
  words.forEach((expected, p) => {
    const got = wordsOf(output[p])
    const at = got.findIndex((w, k) => w !== expected[k])
    assert.ok(got.length === expected.length && at < 0, `fixture ${i}, page ${p + 1}: words differ (got ${got.length}, expected ${expected.length}; first difference at ${at < 0 ? got.length : at}: ${JSON.stringify(got[at])} vs ${JSON.stringify(expected[at])})`)
  })
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// The check can fail: empty text, pages merged into one, pages swapped, a dropped word.
{
  const i = 3, { words } = fixtures[i], pageTexts = words.map((w) => w.join(' '))
  const rejects = (out) => { try { verifyOne(i, out); return false } catch { return true } }
  assert.ok(!rejects(pageTexts), 'self-check: the true text must pass')
  assert.ok(rejects(pageTexts.map(() => '')) && rejects([pageTexts.join(' ')]) && rejects([pageTexts[1], pageTexts[0], pageTexts[2]]) && rejects([pageTexts[0].replace(/\s\S+$/, ''), pageTexts[1], pageTexts[2]]) && rejects(pageTexts.join(' ')), 'self-check')
}
