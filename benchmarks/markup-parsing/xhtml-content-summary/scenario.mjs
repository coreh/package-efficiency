import { strict as assert } from 'node:assert'
// Words are kept decoded; `esc` writes them as markup. The expected figures are
// summed from the decoded strings while the document is written, so no parser
// is involved in producing them.
const words = ['alpha', 'beta', 'gamma', 'delta', 'café', '日本語', 'São Paulo', 'naïve 😀', 'Tom & Jerry', '1 < 2 > 0', 'say "hi"', "it's"]
const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;', '©': '&#169;', '—': '&#x2014;' }
const esc = (s) => s.replace(/[&<>"'©—]/g, (c) => entities[c])
// Unicode code points (a string iterates by code point, so the emoji is one).
const codePoints = (s) => [...s].length
// Code points other than space, tab, line feed and carriage return.
const nonSpace = (s) => [...s].filter((c) => c !== ' ' && c !== '\t' && c !== '\n' && c !== '\r').length
const build = (n) => {
  const expected = { elements: 0, attributes: 0, text: 0 }
  // Character data: counted decoded, written escaped.
  const t = (s) => {
    expected.text += nonSpace(s)
    return esc(s)
  }
  const el = (name, attrs, inner) => {
    expected.elements++
    const a = attrs ? ' ' + Object.entries(attrs).map(([k, v]) => {
      expected.attributes += codePoints(v)
      return `${k}="${esc(v)}"`
    }).join(' ') : ''
    return inner === undefined ? `<${name}${a}/>` : `<${name}${a}>${inner}</${name}>`
  }
  const w = (i) => words[i % words.length]
  const inline = (i) => `${t(w(i))} ${el('em', null, t(w(i + 1)))}${t(' and ')}${el('strong', { class: `c${i % 4}` }, t(w(i + 2)))} ${el('a', { href: `/page/${i}?x=1&y=2`, title: 'a "link"' }, el('span', null, t(w(i + 3))))}`
  const para = (i) => el('p', { id: `p${i}` }, `${inline(i)}${i % 3 === 0 ? el('br') : ''} ${t(w(i + 4))}`)
  const list = (i, k) => el('ul', { class: 'list' }, Array.from({ length: k }, (_, j) => '\n      ' + el('li', null, `${t(w(i + j))} ${j % 2 ? el('a', { href: `#i${j}` }, t(w(j))) : ''}`)).join('') + '\n    ')
  const table = (i, rows) => el('table', { border: '1' },
    '\n      ' + el('thead', null, el('tr', null, ['id', 'name', 'value'].map((h) => el('th', null, t(h))).join(''))) +
    '\n      ' + el('tbody', null, Array.from({ length: rows }, (_, r) => '\n        ' + el('tr', null, el('td', null, t(`${r}`)) + el('td', null, t(w(i + r))) + el('td', null, el('code', null, t(`${(i + r) * 7}`))))).join('') + '\n      ') + '\n    ')
  const section = (i) => el('section', { id: `s${i}` }, '\n    ' + [
    el('h2', null, t(`Section ${i}: ${w(i)}`)),
    para(i), '<!-- a comment about this section -->', para(i + 1),
    list(i, 2 + i % 5),
    el('img', { src: `/img/${i}.png`, alt: w(i) }),
    table(i, 1 + i % 6),
    para(i + 2),
  ].join('\n    ') + '\n  ')
  const head = el('head', null, '\n  ' + [el('meta', { charset: 'utf-8' }), el('title', null, t(`Document ${n} & friends`)), el('link', { rel: 'stylesheet', href: '/a.css' }), el('meta', { name: 'viewport', content: 'width=device-width' })].join('\n  ') + '\n')
  const header = el('header', null, '\n  ' + el('h1', null, t(`Title ${n}`)) + '\n  ' + el('nav', null, el('ul', null, ['Home', 'About', 'Docs'].map((s) => el('li', null, el('a', { href: `/${s}` }, t(s)))).join(''))) + '\n')
  const sections = Array.from({ length: n }, (_, i) => '  ' + section(i)).join('\n')
  const footer = el('footer', null, el('p', null, t(`© 2026 — ${w(n)}`)))
  const body = el('body', null, `\n${header}\n${el('main', null, `\n${sections}\n`)}\n${footer}\n`)
  const html = el('html', { lang: 'en' }, `\n${head}\n${body}\n`)
  return { input: html + '\n', expected }
}
export const cases = Array.from({ length: 40 }, (_, i) => build(i + Math.floor((i * i) / 60)))
const fields = ['attributes', 'elements', 'text']
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const output = outputs[i]
    assert.ok(output !== null && typeof output === 'object' && !Array.isArray(output), `fixture ${i}: object output required`)
    assert.deepEqual(Object.keys(output).sort(), fields, `fixture ${i}: output must have exactly elements, attributes and text`)
    for (const field of fields) {
      assert.ok(Number.isInteger(output[field]), `fixture ${i}: integer ${field} required`)
      assert.equal(output[field], expected[field], `fixture ${i}: ${field}`)
    }
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.elements + value.attributes + value.text
