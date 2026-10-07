import { strict as assert } from 'node:assert'
// Source files are written piece by piece, and the pieces whose kind every
// highlighter must tell apart are recorded as probes: [start, end, kind] in
// UTF-16 offsets, kind one of comment, string, keyword, number, plain.
const nouns = ['total', 'items', 'buffer', 'cursor', 'record', 'offset', 'result', 'weight', 'bucket', 'client', 'header', 'margin']
const verbs = ['collect', 'reduce', 'render', 'measure', 'resolve', 'append', 'filter', 'combine']
const phrases = ['keeps the running sum', 'skips empty rows', 'see the note above', 'rounds half up', 'café and naïve inputs', 'must stay sorted']
const pick = (pool, i, k = 0) => pool[(i * 5 + k * 3) % pool.length]
const writer = () => {
  const out = { code: '', probes: [] }
  // A probe covers the body of a token: quotes and comment markers are left
  // out, because some highlighters style those as punctuation.
  const marker = { string: true, comment: true }
  const put = (kind) => (text) => {
    if (kind) {
      const lead = marker[kind] ? (/^["']+|^\/\/|^\/\*|^#/.exec(text)?.[0].length ?? 0) : 0
      const tail = marker[kind] ? (/["']+$|\*\/$/.exec(text.slice(lead))?.[0].length ?? 0) : 0
      if (text.length - lead - tail > 0) out.probes.push([out.code.length + lead, out.code.length + text.length - tail, kind])
    }
    out.code += text
    return w
  }
  const w = { out, raw: put(null), c: put('comment'), s: put('string'), k: put('keyword'), n: put('number'), id: put('plain') }
  return w
}
const javascript = (seed, blocks) => {
  const w = writer()
  w.c(`// ${pick(phrases, seed)}: don't "return" 42 here`).raw('\n')
  w.k('import').raw(' { ').id('readFileSync').raw(' } from ').s("'node:fs'").raw('\n')
  w.c(`/* ${pick(phrases, seed, 1)}\n * it's a block with // slashes and "quotes"\n */`).raw('\n')
  w.k('const').raw(' ').id('LIMIT').raw(' = ').n(String(40 + seed)).raw('\n\n')
  for (let b = 0; b < blocks; b++) {
    const i = seed * 7 + b, fn = pick(verbs, i) + (b + 1), a = pick(nouns, i), t = pick(nouns, i, 1), e = pick(nouns, i, 2) + 'Item'
    if (b % 3 === 0) w.c(`// ${pick(phrases, i, 2)} (${b})`).raw('\n')
    if (b % 4 === 1) w.k('export').raw(' ')
    w.k('function').raw(' ').id(fn).raw('(').id(a).raw(', scale = ').n(['2.5', '10', '0.125', '3'][i % 4]).raw(') {\n')
    w.raw('  ').k('let').raw(' ').id(t).raw(' = ').n('0').raw('\n')
    w.raw('  ').k('for').raw(' (').k('const').raw(' ').id(e).raw(' of ').id(a).raw(') {\n')
    w.raw('    ').k('if').raw(' (').id(e).raw('.size > ').n(String(10 + (i % 90))).raw(') {\n')
    w.raw('      ').id(t).raw(' += ').id(e).raw('.size * scale ').c(`// ${pick(phrases, i, 3)}, "quoted"`).raw('\n')
    w.raw('    } ').k('else').raw(' {\n')
    w.raw('      ').id(t).raw(' -= ').n(String(1 + (i % 7))).raw('\n    }\n  }\n')
    if (b % 2 === 0) {
      w.raw('  ').k('while').raw(' (').id(t).raw(' > ').n('1000').raw(') ').id(t).raw(' /= ').n('2').raw('\n')
      w.raw('  ').k('const').raw(' label = ').s(`"http://example.com/${fn}#${b} // not a comment"`).raw('\n')
    } else {
      w.raw('  ').k('const').raw(' label = ').s("'it is /* not */ a comment: ").raw("\\'").s(`${b}`).raw("\\'").s("'").raw('\n')
    }
    w.raw('  ').k('return').raw(' label + ').id(t).raw('\n}\n\n')
  }
  w.k('class').raw(' ').id('Summary' + seed).raw(' {\n  render() {\n    ').k('return').raw(' ').s('"done"').raw('\n  }\n}\n')
  return w.out
}
const python = (seed, blocks) => {
  const w = writer()
  w.c(`# ${pick(phrases, seed)}: don't "return" 42 here`).raw('\n')
  w.k('import').raw(' ').id('os').raw('\n\n')
  w.id('LIMIT').raw(' = ').n(String(40 + seed)).raw('\n\n')
  for (let b = 0; b < blocks; b++) {
    const i = seed * 7 + b, fn = pick(verbs, i) + '_' + (b + 1), a = pick(nouns, i), t = pick(nouns, i, 1), e = pick(nouns, i, 2) + '_item'
    if (b % 3 === 0) w.c(`# ${pick(phrases, i, 2)} (${b})`).raw('\n')
    w.k('def').raw(' ').id(fn).raw('(').id(a).raw(', scale=').n(['2.5', '10', '0.125', '3'][i % 4]).raw('):\n')
    w.raw('    ').id(t).raw(' = ').n('0').raw('\n')
    w.raw('    ').k('for').raw(' ').id(e).raw(' in ').id(a).raw(':\n')
    w.raw('        ').k('if').raw(' ').id(e).raw('.size > ').n(String(10 + (i % 90))).raw(':\n')
    w.raw('            ').id(t).raw(' += ').id(e).raw('.size * scale  ').c(`# ${pick(phrases, i, 3)}, "quoted"`).raw('\n')
    w.raw('        ').k('else').raw(':\n')
    w.raw('            ').id(t).raw(' -= ').n(String(1 + (i % 7))).raw('\n')
    if (b % 2 === 0) {
      w.raw('    ').k('while').raw(' ').id(t).raw(' > ').n('1000').raw(':\n        ').id(t).raw(' /= ').n('2').raw('\n')
      w.raw('    label = ').s(`"http://example.com/${fn}#${b} # not a comment"`).raw('\n')
    } else {
      w.raw('    label = ').s("'it is # not a comment: ").raw("\\'").s(`${b}`).raw("\\'").s("'").raw('\n')
    }
    w.raw('    ').k('return').raw(' label, ').id(t).raw('\n\n\n')
  }
  w.k('class').raw(' ').id('Summary' + seed).raw(':\n    ').k('def').raw(' ').id('render').raw('(self):\n        ').k('return').raw(' ').s('"done"').raw('\n')
  return w.out
}
const sizes = [2, 4, 6, 9, 12, 16, 20, 26, 32, 40, 3, 14]
const sources = Array.from({ length: 24 }, (_, i) => i % 2 ? { language: 'python', ...python(i, sizes[(i >> 1) % sizes.length]) } : { language: 'javascript', ...javascript(i, sizes[(i >> 1) % sizes.length]) })
export const cases = sources.map(({ language, code }) => ({ input: { language, code } }))

// The check reads the markup the way a browser would: the visible text, and for
// every character the styling of the innermost element around it (its class
// and style attributes; '' when no styled element encloses it).
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' }
const decode = (s) => s.replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);/g, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : entities[e] ?? m)
export const readHighlighted = (html) => {
  let text = ''
  const styles = [], stack = []
  const re = /<(\/?)([A-Za-z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)/g
  let m, afterPre = false
  while ((m = re.exec(html))) {
    if (m[4] !== undefined) {
      let piece = decode(m[4])
      if (afterPre && piece[0] === '\n') piece = piece.slice(1) // HTML drops a newline right after <pre>
      afterPre = false
      const style = stack.findLast((s) => s !== null) ?? ''
      for (let i = 0; i < piece.length; i++) styles.push(style)
      text += piece
    } else if (m[1]) {
      assert.ok(stack.length, 'closing tag without an open element')
      stack.pop(); afterPre = false
    } else {
      const attr = (name) => new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(m[3])?.slice(1).find((v) => v !== undefined)
      const cls = attr('class'), style = attr('style')
      // A wrapper around the whole listing (pre, code, div) styles nothing in particular.
      const wrapper = /^(pre|code|div|table|tbody|tr|td)$/i.test(m[2])
      stack.push(wrapper || (cls === undefined && style === undefined) ? null : `${cls ?? ''}|${(style ?? '').replace(/\s+/g, '')}`)
      afterPre = /^pre$/i.test(m[2])
    }
  }
  assert.equal(stack.length, 0, 'unclosed element')
  return { text, styles }
}
const trimEnd = (s) => s.replace(/\n+$/, '')
export const verifyOne = (i, html) => {
  const { code, probes } = sources[i]
  assert.equal(typeof html, 'string', `fixture ${i}: an HTML string is required`)
  const { text, styles } = readHighlighted(html)
  assert.equal(trimEnd(text), trimEnd(code), `fixture ${i}: the visible text of the markup is not the source`)
  // Which stylings each kind of token was given.
  const seen = { comment: new Map(), string: new Map(), keyword: new Map(), number: new Map(), plain: new Map() }
  for (const [start, end, kind] of probes) for (let p = start; p < end; p++) if (!/\s/.test(code[p]) && !seen[kind].has(styles[p])) seen[kind].set(styles[p], p)
  // Styling is the library's own business, but it must tell the kinds apart:
  // no styling may be shared by two of comment, string, keyword and number,
  // and plain identifiers may not look like comments or strings.
  const pairs = [['comment', 'string'], ['comment', 'keyword'], ['comment', 'number'], ['string', 'keyword'], ['string', 'number'], ['keyword', 'number'], ['plain', 'comment'], ['plain', 'string']]
  for (const [a, b] of pairs) for (const [style, p] of seen[a]) {
    const q = seen[b].get(style)
    assert.ok(q === undefined, `fixture ${i}: a ${a} (${JSON.stringify(code.slice(p, p + 12))}) and a ${b} (${JSON.stringify(code.slice(q ?? 0, (q ?? 0) + 12))}) are styled alike: ${JSON.stringify(style)}`)
  }
  for (const kind of ['comment', 'string', 'keyword', 'number']) assert.ok(!seen[kind].has(''), `fixture ${i}: a ${kind} is left unstyled at ${JSON.stringify(code.slice(seen[kind].get(''), seen[kind].get('') + 12))}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
