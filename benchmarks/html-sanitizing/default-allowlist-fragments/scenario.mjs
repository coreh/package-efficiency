import { strict as assert } from 'node:assert'
// Fragments are written piece by piece. The generator records the truth while
// it writes: the texts that must survive, in order, the elements of the
// allow-list every sanitizer shares that must survive (with their count), and
// the href of every link that is safe.
const words = ['Quarterly', 'budget', 'harbour', 'lantern', 'meadow', 'copper', 'orchard', 'signal', 'pepper', 'granite', 'velvet', 'anchor']
const word = (i, k = 0) => words[(i * 5 + k * 3) % words.length]
const KEPT = ['a', 'b', 'i', 'em', 'strong', 'ul', 'li', 'code', 'blockquote']

const writer = (seed) => {
  const out = { html: '', texts: [], counts: Object.fromEntries(KEPT.map((t) => [t, 0])), hrefs: [] }
  let n = 0
  const mark = () => `${word(seed, n)}${word(seed + 3, n++)}${seed}x${n}`
  const w = {
    out,
    raw: (s) => { out.html += s; return w },
    // plain text that must survive, wrapped in an allowed element or not
    text: (s) => { out.texts.push(s); return w },
    tag: (name, inner) => { out.counts[name]++; return `<${name}>${inner}</${name}>` },
    mark,
  }
  return w
}

// Benign pieces: allowed elements and text that every sanitizer keeps.
const benign = [
  (w, i) => { const a = w.mark(), b = w.mark(), c = w.mark(); w.text(a).text(b).text(c); w.raw(`<p>${a} ${w.tag('b', b)} and ${w.tag('i', c)}</p>\n`) },
  (w, i) => { const a = w.mark(), b = w.mark(); w.text(a).text(b); w.raw(`<p>${w.tag('strong', a)}: ${w.tag('em', b)}</p>\n`) },
  (w, i) => {
    const a = w.mark(), b = w.mark(), c = w.mark()
    w.text(a).text(b).text(c)
    w.out.counts.ul++
    w.raw(`<ul>${w.tag('li', a)}${w.tag('li', b)}${w.tag('li', c)}</ul>\n`)
  },
  (w, i) => {
    const a = w.mark(), href = `https://example.com/${word(i)}/${i}?q=${word(i, 1)}&page=${i % 9 + 1}`
    w.text(a); w.out.hrefs.push(href); w.out.counts.a++
    w.raw(`<p>See <a href="${href.replace(/&/g, '&amp;')}" title="a title">${a}</a> for details.</p>\n`)
  },
  (w, i) => { const a = w.mark(), b = w.mark(); w.text(a).text(b); w.raw(w.tag('blockquote', `${a} ${w.tag('em', b)}`) + '\n') },
  (w, i) => { const a = w.mark(); w.text(a); w.text('x < y && y > z'); w.raw(`<p>${a} ${w.tag('code', 'x &lt; y &amp;&amp; y &gt; z')}</p>\n`) },
  (w, i) => { const a = w.mark(); w.text(`${a} café naïve 日本語 ©`); w.raw(`<p>${a} café naïve 日本語 &copy;</p>\n`) },
  // an allowed element with an attribute that must go: the element stays
  (w, i) => { const a = w.mark(); w.text(a); w.raw(`<p>${w.tag('b', a).replace('<b>', `<b onclick="steal(${i})" onmouseover="steal(${i})">`)}</p>\n`) },
  // a safe link that also has a handler: the link stays, the handler goes
  (w, i) => {
    const a = w.mark(), href = `https://example.org/${word(i, 2)}`
    w.text(a); w.out.hrefs.push(href); w.out.counts.a++
    w.raw(`<p><a href="${href}" onclick="track(${i})" onfocus="track(${i})">${a}</a></p>\n`)
  },
]

// Hostile pieces: nothing in them has to survive except the text that is
// marked, which sits in elements every sanitizer unwraps or escapes.
const hostile = [
  (w, i) => w.raw(`<script>alert(${i})</script>\n`),
  (w, i) => w.raw(`<SCRIPT SRC=//evil.example/${i}.js></SCRIPT>\n<ScRiPt>document.cookie</sCrIpT>\n`),
  (w, i) => w.raw(`<img src="x" onerror="alert(${i})">\n<img/src=x/onerror=alert(${i})>\n`),
  (w, i) => { const a = w.mark(); w.text(a); w.raw(`<p><a href="javascript:alert(${i})">${a}</a></p>\n`) },
  (w, i) => { const a = w.mark(); w.text(a); w.raw(`<p><a href="  JaVaScRiPt:alert(${i})">${a}</a></p>\n`) },
  (w, i) => { const a = w.mark(); w.text(a); w.raw(`<p><a href="java&#x09;script:alert(${i})">${a}</a></p>\n`) },
  (w, i) => { const a = w.mark(); w.text(a); w.raw(`<p><a href="&#106;avascript&#58;alert(${i})">${a}</a></p>\n`) },
  (w, i) => { const a = w.mark(); w.text(a); w.raw(`<p><a href="vbscript:msgbox(${i})">${a}</a> <a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a></p>\n`) },
  (w, i) => { const a = w.mark(); w.text(a); w.raw(`<div onclick="alert(${i})" onmouseover="alert(${i})" style="background:url(javascript:alert(${i}))">${a}</div>\n`) },
  (w, i) => { const a = w.mark(); w.text(a); w.raw(`<span style="width:expression(alert(${i}))" onload="alert(${i})">${a}</span>\n`) },
  (w, i) => w.raw(`<svg onload="alert(${i})" xmlns="http://www.w3.org/2000/svg"><script>alert(${i})</script><circle r="5"/></svg>\n`),
  (w, i) => w.raw(`<iframe src="javascript:alert(${i})"></iframe>\n<iframe src="https://evil.example/${i}"></iframe>\n`),
  (w, i) => w.raw(`<object data="javascript:alert(${i})"></object><embed src="https://evil.example/${i}.swf">\n`),
  (w, i) => w.raw(`<style>@import 'https://evil.example/${i}.css'; body { background: red }</style>\n`),
  (w, i) => w.raw(`<form action="javascript:alert(${i})"><button formaction="javascript:alert(${i})">Send ${i}</button></form>\n`),
  (w, i) => { const a = w.mark(); w.text(a); w.raw(`<blink>${a}</blink>\n`) },
  (w, i) => { const a = w.mark(); w.text(a); w.raw(`<x-widget data-id="${i}" onclick="alert(${i})">${a}</x-widget>\n`) },
  (w, i) => w.raw(`<<script>alert(${i})//<</script>\n<scr<script>ipt>alert(${i})</scr</script>ipt>\n`),
  (w, i) => w.raw(`<!-- <script>alert(${i})</script> -->\n<img src=x onerror=alert(${i})//>\n`),
  (w, i) => { const a = w.mark(); w.text(a); w.raw(`<p>${a}\n<br><hr>\n`) },
  (w, i) => w.raw(`<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==" alt="${i}">\n<a onclick=alert(${i})>.</a>\n`),
]

const fragment = (seed, blocks) => {
  const w = writer(seed)
  for (let b = 0; b < blocks; b++) {
    const i = seed * 13 + b
    // two benign pieces to one hostile, in a mixed order
    if (b % 3 === 2) hostile[(i * 7 + b) % hostile.length](w, i)
    else benign[(i * 5 + b) % benign.length](w, i)
  }
  // every fragment ends with one of each so that no fixture misses a kind
  benign[seed % benign.length](w, seed + 100)
  hostile[seed % hostile.length](w, seed + 100)
  return w.out
}

const sizes = [3, 4, 5, 6, 8, 10, 12, 14, 18, 22, 26, 30, 36, 44, 3, 7, 9, 16, 24, 40]
const fixtures = Array.from({ length: 40 }, (_, i) => fragment(i + 1, sizes[i % sizes.length]))
export const cases = fixtures.map((f) => ({ input: f.html, expected: { texts: f.texts, counts: f.counts, hrefs: f.hrefs } }))

// --- The reader: a strict HTML tokenizer ----------------------------------
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', hellip: '…', mdash: '—', ndash: '–', eacute: 'é', iuml: 'ï', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', times: '×', middot: '·' }
const decode = (s) => s.replace(/&(?:#[xX]([0-9a-fA-F]+)|#([0-9]+)|([A-Za-z][A-Za-z0-9]*));?/g, (all, hex, dec, name) => {
  if (name !== undefined) {
    if (name in entities && all.endsWith(';')) return entities[name]
    if (all.endsWith(';')) throw new Error(`unknown entity ${all}`)
    return all
  }
  return String.fromCodePoint(hex ? parseInt(hex, 16) : parseInt(dec, 10))
})
const rawText = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'plaintext'])
// Tags and text in document order: { tag, attrs: [[name, value]], close } | { text }
export const tokenize = (html) => {
  const tokens = []
  let i = 0
  const n = html.length
  while (i < n) {
    const lt = html.indexOf('<', i)
    if (lt < 0) { tokens.push({ text: decode(html.slice(i)) }); break }
    if (lt > i) tokens.push({ text: decode(html.slice(i, lt)) })
    const next = html[lt + 1]
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4)
      assert.ok(end >= 0, 'unterminated comment')
      i = end + 3
    } else if (next === '!' || next === '?') {
      const end = html.indexOf('>', lt)
      assert.ok(end >= 0, 'unterminated declaration')
      i = end + 1
    } else if (next !== undefined && /[A-Za-z]/.test(next) || (next === '/' && /[A-Za-z]/.test(html[lt + 2] ?? ''))) {
      const close = next === '/'
      let j = lt + (close ? 2 : 1)
      const nameEnd = /[\s/>]/.exec(html.slice(j))
      assert.ok(nameEnd, 'unterminated tag')
      const tag = html.slice(j, j + nameEnd.index).toLowerCase()
      j += nameEnd.index
      const attrs = []
      for (;;) {
        while (j < n && /[\s/]/.test(html[j])) j++
        assert.ok(j < n, `unterminated tag <${tag}`)
        if (html[j] === '>') { j++; break }
        const m = /^[^\s/>=]+/.exec(html.slice(j))
        assert.ok(m, 'bad attribute')
        const name = m[0].toLowerCase()
        j += m[0].length
        while (j < n && /\s/.test(html[j])) j++
        let value = ''
        if (html[j] === '=') {
          j++
          while (j < n && /\s/.test(html[j])) j++
          if (html[j] === '"' || html[j] === "'") {
            const end = html.indexOf(html[j], j + 1)
            assert.ok(end >= 0, 'unterminated attribute value')
            value = html.slice(j + 1, end)
            j = end + 1
          } else {
            const v = /^[^\s>]*/.exec(html.slice(j))[0]
            value = v
            j += v.length
          }
        }
        attrs.push([name, decode(value)])
      }
      tokens.push({ tag, attrs, close })
      i = j
      if (!close && rawText.has(tag)) {
        const end = html.toLowerCase().indexOf(`</${tag}`, i)
        if (end < 0) { i = n } else {
          if (end > i) tokens.push({ raw: html.slice(i, end) })
          i = end
        }
      }
    } else {
      tokens.push({ text: '<' })
      i = lt + 1
    }
  }
  return tokens
}

const forbiddenTags = new Set(['script', 'iframe', 'object', 'embed', 'applet', 'frame', 'frameset', 'base'])
const urlAttrs = new Set(['href', 'src', 'action', 'formaction', 'xlink:href', 'srcset', 'data', 'background', 'poster', 'ping', 'codebase', 'longdesc', 'lowsrc', 'dynsrc', 'cite', 'manifest'])
const dangerousUrl = (value, media) => {
  const v = value.replace(/[\u0000- ]/g, '').toLowerCase()
  return /^(javascript|vbscript|livescript|mocha):/.test(v) || (!media && /^data:/.test(v))
}
const squash = (s) => s.replace(/\s+/g, ' ')

// Checks one output against what the generator recorded.
export const verifyOne = (i, output) => {
  const { expected } = cases[i]
  assert.equal(typeof output, 'string', `fixture ${i}: string output required`)
  const tokens = tokenize(output)
  const counts = Object.fromEntries(KEPT.map((t) => [t, 0]))
  const hrefs = []
  let text = ''
  for (const t of tokens) {
    if (t.text !== undefined) { text += t.text; continue }
    if (t.raw !== undefined || t.close) continue
    assert.ok(!forbiddenTags.has(t.tag), `fixture ${i}: <${t.tag}> left in the output`)
    for (const [name, value] of t.attrs) {
      assert.ok(!name.startsWith('on'), `fixture ${i}: attribute ${name} left on <${t.tag}>`)
      if (urlAttrs.has(name)) assert.ok(!dangerousUrl(value, name === 'src' && ['img', 'source', 'video', 'audio', 'track'].includes(t.tag)), `fixture ${i}: ${name}="${value}" left on <${t.tag}>`)
    }
    if (t.tag in counts) {
      counts[t.tag]++
      if (t.tag === 'a') {
        const href = t.attrs.find(([name]) => name === 'href')
        // a link that kept an address kept a safe one; <a> and <a href> with no address are fine
        if (href && href[1] !== '') hrefs.push(href[1])
        else counts.a--
      }
    }
  }
  assert.deepEqual(counts, expected.counts, `fixture ${i}: allowed elements`)
  assert.deepEqual(hrefs, expected.hrefs, `fixture ${i}: link addresses`)
  const seen = squash(text)
  let at = 0
  for (const piece of expected.texts) {
    const found = seen.indexOf(squash(piece), at)
    assert.ok(found >= 0, `fixture ${i}: text "${piece}" missing or out of order`)
    at = found + squash(piece).length
  }
}

// The proof that the check can fail: the input unchanged, and the input with
// every tag cut out, are both refused.
const stripTags = (s) => s.replace(/<[^>]*>/g, '')
assert.throws(() => verifyOne(0, cases[0].input), 'unsanitized input must fail')
assert.throws(() => verifyOne(0, stripTags(cases[0].input)), 'text without elements must fail')
assert.throws(() => verifyOne(0, cases[0].input.replace(/<script>.*?<\/script>/gs, '')), 'a partial clean must fail')

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, output] of outputs.entries()) verifyOne(i, output)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
