import { strict as assert } from 'node:assert'
// An input is an HTML fragment (a string). The generator records, while it
// writes each fragment, what a correct Markdown conversion must contain: the
// block structure as a list of tokens and the inline elements in order.
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const words = ['alpha', 'bridge', 'Café', 'crème', 'delta', 'engine', 'naïve', 'forest', 'garden', 'harbor', 'index', 'jungle', 'kernel', 'lantern', 'meadow', 'R&D', 'Q&A', 'north', 'orbit', 'parser', 'quartz', 'river', 'signal', 'table', 'umbrella', 'vector', 'window', 'yellow', 'zebra', '日本語', 'données', 'über', 'cache', 'buffer', 'stream', 'node', 'tree', 'v2', '12', '2026', 'it\'s', '"quoted"']
const idents = ['parse_value()', 'Array.map', 'user.name', 'max(a, b)', 'HTTP_PORT', 'fs.readFile', 'x += 1', 'List<T>', 'a && b']
const snippets = [
  'function add(a, b) {\n    if (a < b && b > 0) {\n        return a & b;\n    }\n    return "done";\n}',
  '# compute totals\ndef total(items):\n    result = 0\n    for item in items:\n        result += item["price"]\n\n    return result',
  '- not a list\n* not a list either\n1. nor this\n## nor a heading\n<div class="x">&amp;</div>',
  'SELECT name, COUNT(*) AS n\n  FROM users\n WHERE age > 21 AND city = \'Paris\'\n GROUP BY name;',
]
const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
const collapse = (s) => s.replace(/\s+/g, ' ').trim()

const build = (seed, blockCount) => {
  const r = mulberry32(seed * 7919 + 13)
  const int = (n) => Math.floor(r() * n)
  const pick = (a) => a[int(a.length)]
  const phrase = (min, max) => Array.from({ length: min + int(max - min + 1) }, () => pick(words)).join(' ')
  const expected = { tokens: [], links: [], strong: [], em: [], code: [] }
  // Inline content: returns { html, text } and records inline elements in order.
  const inlines = (links) => {
    const parts = []
    const n = 1 + int(5)
    for (let k = 0; k < n; k++) {
      const x = r()
      if (x < 0.58 || k === n - 1 && x < 0.9) {
        let t = phrase(1, 8)
        if (r() < 0.3) t = t.replace(/ /, '\n    ')
        parts.push({ html: escHtml(t), text: t })
      } else if (x < 0.68) { const t = phrase(1, 3); parts.push({ html: `<strong>${escHtml(t)}</strong>`, text: t, rec: ['strong', t] }) }
      else if (x < 0.78) { const t = phrase(1, 3); const tag = r() < 0.5 ? 'em' : 'i'; parts.push({ html: `<${tag}>${escHtml(t)}</${tag}>`, text: t, rec: ['em', t] }) }
      else if (x < 0.86) { const t = pick(idents); parts.push({ html: `<code>${escHtml(t)}</code>`, text: t, rec: ['code', t] }) }
      else if (links) {
        const t = phrase(1, 3)
        const href = r() < 0.7 ? `https://example.com/${pick(['docs', 'blog', 'api', 'guide'])}/${int(900)}` : `/section-${int(90)}/page${int(9)}#part${int(9)}`
        const title = r() < 0.3 ? ` title="${escAttr('About ' + pick(words.filter((w) => !w.includes('"'))))}"` : ''
        parts.push({ html: `<a href="${escAttr(href)}"${title}>${escHtml(t)}</a>`, text: t, rec: ['links', [t, href]] })
      } else { const t = phrase(1, 4); parts.push({ html: escHtml(t), text: t }) }
    }
    const last = parts[parts.length - 1]
    if (!last.rec && r() < 0.8) { last.html += '.'; last.text += '.' }
    for (const p of parts) if (p.rec) expected[p.rec[0]].push(p.rec[1])
    return { html: parts.map((p) => p.html).join(' '), text: collapse(parts.map((p) => p.text).join(' ')) }
  }
  const list = (depth, indent) => {
    const ordered = r() < 0.4
    const tag = ordered ? 'ol' : 'ul'
    const pad = '  '.repeat(indent)
    const items = []
    const count = 2 + int(depth === 0 ? 4 : 2)
    for (let i = 0; i < count; i++) {
      const own = inlines(true)
      expected.tokens.push(['li', depth, ordered, own.text])
      let html = own.html
      if (depth < 2 && r() < 0.3) html += '\n' + list(depth + 1, indent + 2)
      items.push(`${pad}  <li>${html}${html.includes('\n') ? '\n' + pad + '  ' : ''}</li>`)
    }
    return `${pad}<${tag}>\n${items.join('\n')}\n${pad}</${tag}>`
  }
  // Each list token above is pushed before its children, so the order is the document order.
  const blocks = []
  let prev = ''
  for (let b = 0; b < blockCount; b++) {
    let kind = b === 0 ? 'h1' : ['p', 'p', 'p', 'p', 'h', 'h', 'list', 'list', 'pre'][int(9)]
    if (kind === 'pre' && (prev === 'list' || prev === 'pre')) kind = 'p'
    if (kind === 'h') kind = 'h' + (2 + int(5))
    if (kind === 'list' && prev === 'list') kind = 'p'
    prev = kind.startsWith('h') ? 'h' : kind
    if (kind === 'p') {
      const x = inlines(true)
      expected.tokens.push(['p', x.text])
      blocks.push(`<p>${x.html}</p>`)
    } else if (kind[0] === 'h') {
      const level = Number(kind[1])
      const t = phrase(1, 5)
      expected.tokens.push(['h', level, collapse(t)])
      blocks.push(`<h${level}${r() < 0.2 ? ` id="s${b}"` : ''}>${escHtml(t)}</h${level}>`)
    } else if (kind === 'list') {
      blocks.push(list(0, 0))
    } else {
      const code = pick(snippets)
      expected.tokens.push(['pre', code])
      const body = escHtml(code) + (r() < 0.5 ? '\n' : '')
      blocks.push(`<pre><code class="language-${pick(['js', 'python', 'text'])}">${body}</code></pre>`)
    }
  }
  return { input: `<article>\n${blocks.join('\n\n')}\n</article>`, expected }
}
const counts = [3, 6, 10, 16, 24, 40, 70, 110, 160, 200, 12, 30]
const fixtures = counts.map((n, s) => build(s + 1, n))
export const cases = fixtures.map((f) => ({ input: f.input }))

// A small reader for the Markdown an output may be written in. It yields the
// block tokens and the inline elements, whatever the style: ATX or setext
// headings; -, * or + bullets; any indentation of nested lists; fenced or
// indented code; * or _ for emphasis; backslash escapes; line wrapping.
const unescapeMd = (s) => s.replace(/\\([\\`*_{}\[\]()#+\-.!|<>~&"'])/g, '$1')
export const readMarkdown = (md) => {
  const lines = md.replace(/\r\n?/g, '\n').split('\n').map((l) => l.replace(/\t/g, '    ').replace(/\s+$/, ''))
  const out = { tokens: [], links: [], strong: [], em: [], code: [] }
  const re = /\[((?:[^\]\\]|\\.)*)\]\(<?([^)\s>]*)>?(?:\s+"(?:[^"\\]|\\.)*")?\)|`([^`]+)`|\*\*(\S(?:.*?\S)?)\*\*|__(\S(?:.*?\S)?)__|\*(\S(?:[^*]*?\S)?)\*|(?<![\w])_(\S(?:[^_]*?\S)?)_(?![\w])/g
  const inline = (s) => {
    let plain = ''
    let last = 0
    for (const m of s.matchAll(re)) {
      plain += unescapeMd(s.slice(last, m.index))
      last = m.index + m[0].length
      if (m[2] !== undefined) { const t = collapse(unescapeMd(m[1])); out.links.push([t, unescapeMd(m[2])]); plain += t }
      else if (m[3] !== undefined) { out.code.push(m[3]); plain += m[3] }
      else if (m[4] !== undefined || m[5] !== undefined) { const t = collapse(unescapeMd(m[4] ?? m[5])); out.strong.push(t); plain += t }
      else { const t = collapse(unescapeMd(m[6] ?? m[7])); out.em.push(t); plain += t }
    }
    return collapse(plain + unescapeMd(s.slice(last)))
  }
  let para = []
  let item = null
  let stack = []
  let lastBlank = true
  const flushPara = () => { if (para.length) { out.tokens.push(['p', inline(para.join(' '))]); para = [] } }
  const flushItem = () => { if (item) { out.tokens.push(['li', item.depth, item.ordered, inline(item.lines.join(' '))]); item = null } }
  const indentOf = (l) => l.length - l.trimStart().length
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') { flushPara(); lastBlank = true; continue }
    const indent = indentOf(line)
    const fence = /^ {0,3}(`{3,}|~{3,})/.exec(line)
    if (fence) {
      flushPara(); flushItem(); stack = []
      const code = []
      for (i++; i < lines.length && !lines[i].trimStart().startsWith(fence[1]); i++) code.push(lines[i])
      assert.ok(i < lines.length, 'unclosed code fence')
      out.tokens.push(['pre', code.join('\n').replace(/\n+$/, '')])
      lastBlank = false
      continue
    }
    if (!item && !para.length && lastBlank && indent >= 4) {
      const code = []
      for (; i < lines.length && (lines[i].trim() === '' || indentOf(lines[i]) >= 4); i++) code.push(lines[i].slice(4))
      i--
      out.tokens.push(['pre', code.join('\n').replace(/\n+$/, '')])
      lastBlank = false
      continue
    }
    const marker = /^( *)([-*+]|\d{1,9}[.)]) +(\S.*)$/.exec(line)
    if (marker && !/^([-*_])( *\1){2,} *$/.test(line)) {
      flushPara(); flushItem()
      const ind = marker[1].length
      while (stack.length && ind < stack[stack.length - 1]) stack.pop()
      if (!stack.length || ind > stack[stack.length - 1]) stack.push(ind)
      item = { depth: stack.length - 1, ordered: /\d/.test(marker[2]), lines: [marker[3]] }
      lastBlank = false
      continue
    }
    const atx = /^ {0,3}(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/.exec(line)
    if (atx) {
      flushPara(); flushItem(); stack = []
      out.tokens.push(['h', atx[1].length, inline(atx[2])])
      lastBlank = false
      continue
    }
    if (item && (indent > 0 || !lastBlank)) { item.lines.push(line.trim()); lastBlank = false; continue }
    flushItem(); stack = []
    const setext = /^ {0,3}(=+|-+)\s*$/.exec(line)
    if (setext && para.length) {
      out.tokens.push(['h', setext[1][0] === '=' ? 1 : 2, inline(para.join(' '))])
      para = []
    } else para.push(line.trim())
    lastBlank = false
  }
  flushPara(); flushItem()
  return out
}
const tidy = (tokens) => tokens.map((t) => (t[0] === 'pre' ? ['pre', t[1].split('\n').map((l) => l.replace(/\s+$/, '')).join('\n')] : t))
export const verifyOne = (i, md) => {
  assert.equal(typeof md, 'string', `fixture ${i}: a string is required`)
  const got = readMarkdown(md)
  const want = fixtures[i].expected
  assert.equal(got.tokens.length, want.tokens.length, `fixture ${i}: number of blocks (${got.tokens.length} read, ${want.tokens.length} expected)`)
  const g = tidy(got.tokens)
  const w = tidy(want.tokens)
  for (let k = 0; k < w.length; k++) assert.deepEqual(g[k], w[k], `fixture ${i}: block ${k}`)
  for (const key of ['links', 'strong', 'em', 'code']) assert.deepEqual(got[key], want[key], `fixture ${i}: ${key}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// Proof that the check can fail: the input unchanged, and the input with its
// tags stripped, are not accepted.
for (const wrong of [(h) => h, (h) => h.replace(/<[^>]+>/g, '')]) {
  assert.throws(() => verifyOne(2, wrong(cases[2].input)), undefined, 'a non-conversion must fail the check')
}
