import { strict as assert } from 'node:assert'
// Input: { html, selector }. The same generated document (about 50 KB, 30 cards
// with headings, links, lists, a table and a form) is used for every fixture.
// The adapter's prepare() parses it once, outside the measured call. A correct
// result is the list of elements the selector matches, in document order. Each
// element carries a unique data-n attribute (its position in document order),
// and the check compares those numbers with an independent reference built
// from the tree that generated the document.
const VOID = new Set(['meta', 'link', 'input', 'br', 'img'])
const el = (tag, attrs = {}, ...kids) => ({ tag, attrs, kids })
const t = (s) => s
const kinds = ['note', 'warning', 'info', 'tip']
const langs = ['en-US', 'en', 'pt-BR']
const hrefs = (i, k) => [`https://example.com/doc-${i}.pdf`, `http://static.example.org/page-${i}-${k}`, `/local/${i}/${k}`, '#top', `https://cdn.example.net/${k}.png`, `mailto:user${i}@site.test`][(i + k) % 6]
const card = (i) => {
  const cls = ['card', i % 5 === 0 ? 'featured' : '', i % 7 === 3 ? 'archived' : ''].filter(Boolean).join(' ')
  const kids = [
    el('h2', { class: 'title' }, `Card ${i} title`),
    el('p', { class: 'lead' }, 'Intro text with ', el('a', { href: hrefs(i, 0) }, 'a link'), ' and ', el('span', { class: i % 3 === 0 ? 'badge hidden' : 'badge' }, 'tag'), ' Tom &amp; Jerry.'),
  ]
  if (i % 2) kids.push(el('p', {}, 'Back to ', el('a', { href: '#top' }, 'top'), ' or ', el('a', { name: `anchor-${i}` }, 'anchor'), '.'))
  kids.push(el('h3', { class: 'sub' }, `Details ${i}`), el('p', { class: 'note' }, 'Some notes.'), el('p', {}, 'More notes.'))
  const items = Array.from({ length: 3 + i % 4 }, (_, k) => el('li', k % 2 ? { class: 'item odd' } : { class: 'item' }, el('a', { href: hrefs(i, k + 1) }, `Item ${k}`), ' ', el('span', { class: 'meta' }, `m${k}`)))
  kids.push(el('ul', { class: 'list' }, ...items))
  if (i % 2 === 0) {
    const rows = Array.from({ length: 3 + i % 3 }, (_, r) => el('tr', {}, ...[0, 1, 2].map((c) => (r + c) % 5 === 0 ? el('td') : el('td', { class: c === 0 ? 'key' : 'val' }, `r${r}c${c}`))))
    kids.push(el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'A'), el('th', {}, 'B'), el('th', {}, 'C'))), el('tbody', {}, ...rows)))
  }
  if (i % 3 !== 1) {
    kids.push(el('form', { action: '/submit' },
      el('label', { for: `f${i}` }, 'Name'), el('input', { type: 'text', id: `f${i}`, name: 'name' }),
      el('label', { for: `c${i}` }, 'Agree'), el('input', i % 3 === 0 ? { type: 'checkbox', id: `c${i}`, checked: '' } : { type: 'checkbox', id: `c${i}` }),
      el('input', i % 4 === 0 ? { type: 'submit', value: 'Go', disabled: '' } : { type: 'submit', value: 'Go' })))
  }
  return el(i % 2 ? 'article' : 'div', { class: cls, id: `card-${i}`, 'data-kind': kinds[i % 4], lang: langs[i % 3] }, ...kids)
}
const sections = Array.from({ length: 6 }, (_, s) => el('section', { class: s % 2 ? 'group alt' : 'group' }, el('h1', {}, `Section ${s}`), ...Array.from({ length: 5 }, (_, k) => card(s * 5 + k))))
const page = el('html', { lang: 'en' },
  el('head', {}, el('meta', { charset: 'utf-8' }), el('title', {}, 'Selector document'), el('link', { rel: 'stylesheet', href: '/a.css' })),
  el('body', {}, el('header', { id: 'top' }, el('nav', {}, el('ul', {}, ...['Home', 'Docs', 'About'].map((x, k) => el('li', {}, el('a', { href: ['/', 'https://example.com/docs', '#about'][k] }, x)))))),
    el('main', { id: 'main' }, ...sections), el('footer', {}, el('p', {}, 'Footer ', el('a', { href: 'https://example.com/legal.pdf' }, 'legal')))))
let counter = 0
const link = (node, parent) => { node.parent = parent; node.n = counter++; node.attrs['data-n'] = String(node.n); for (const k of node.kids) if (typeof k !== 'string') link(k, node) }
link(page, { kids: [page] })
const isEl = (x) => typeof x !== 'string'
const ser = (n) => `<${n.tag}${Object.entries(n.attrs).map(([k, v]) => v === '' ? ` ${k}` : ` ${k}="${v}"`).join('')}>${VOID.has(n.tag) ? '' : n.kids.map((k) => isEl(k) ? ser(k) : k).join('') + `</${n.tag}>`}`
const html = '<!doctype html>' + ser(page)
const all = []
const collect = (n) => { all.push(n); n.kids.filter(isEl).forEach(collect) }
collect(page)
const sibs = (e) => e.parent.kids.filter(isEl)
const pos = (e) => sibs(e).indexOf(e) + 1
const posLast = (e) => sibs(e).length - sibs(e).indexOf(e)
const typed = (e) => sibs(e).filter((s) => s.tag === e.tag)
const posType = (e) => typed(e).indexOf(e) + 1
const posTypeLast = (e) => typed(e).length - typed(e).indexOf(e)
const cls = (e, c) => (e.attrs.class ?? '').split(/\s+/).includes(c)
const a = (e, k) => e.attrs[k]
const prev = (e) => sibs(e)[pos(e) - 2]
const anc = (e, f) => { for (let p = e.parent; p && p.tag; p = p.parent) if (f(p)) return true; return false }
const earlier = (e, f) => sibs(e).slice(0, pos(e) - 1).some(f)
const selectors = [
  ['div', (e) => e.tag === 'div'],
  ['.card', (e) => cls(e, 'card')],
  ['#main', (e) => a(e, 'id') === 'main'],
  ['a[href]', (e) => e.tag === 'a' && a(e, 'href') !== undefined],
  ['a[href^="https://"]', (e) => e.tag === 'a' && (a(e, 'href') ?? '').startsWith('https://')],
  ['a[href$=".pdf"]', (e) => e.tag === 'a' && (a(e, 'href') ?? '').endsWith('.pdf')],
  ['a[href*="example"]', (e) => e.tag === 'a' && (a(e, 'href') ?? '').includes('example')],
  ['input[type="checkbox"]', (e) => e.tag === 'input' && a(e, 'type') === 'checkbox'],
  ['li > a', (e) => e.tag === 'a' && e.parent.tag === 'li'],
  ['ul li', (e) => e.tag === 'li' && anc(e, (p) => p.tag === 'ul')],
  ['h2 + p', (e) => e.tag === 'p' && prev(e)?.tag === 'h2'],
  ['h3 ~ p', (e) => e.tag === 'p' && earlier(e, (s) => s.tag === 'h3')],
  ['li:first-child', (e) => e.tag === 'li' && pos(e) === 1],
  ['li:last-child', (e) => e.tag === 'li' && posLast(e) === 1],
  ['li:nth-child(odd)', (e) => e.tag === 'li' && pos(e) % 2 === 1],
  ['tr:nth-child(3n+1)', (e) => e.tag === 'tr' && (pos(e) - 1) % 3 === 0],
  ['td:nth-last-child(2)', (e) => e.tag === 'td' && posLast(e) === 2],
  ['.card.featured', (e) => cls(e, 'card') && cls(e, 'featured')],
  ['div.card > h2.title', (e) => e.tag === 'h2' && cls(e, 'title') && e.parent.tag === 'div' && cls(e.parent, 'card')],
  ['section article p a', (e) => e.tag === 'a' && anc(e, (p) => p.tag === 'p' && anc(p, (q) => q.tag === 'article' && anc(q, (r) => r.tag === 'section')))],
  ['div:not(.featured)', (e) => e.tag === 'div' && !cls(e, 'featured')],
  ['[data-kind="note"]', (e) => a(e, 'data-kind') === 'note'],
  ['[class~="featured"]', (e) => cls(e, 'featured')],
  ['[lang|="en"]', (e) => a(e, 'lang') === 'en' || (a(e, 'lang') ?? '').startsWith('en-')],
  ['a:not([href^="http"])', (e) => e.tag === 'a' && !(a(e, 'href') ?? '').startsWith('http')],
  ['li:nth-of-type(2)', (e) => e.tag === 'li' && posType(e) === 2],
  ['p:first-of-type', (e) => e.tag === 'p' && posType(e) === 1],
  ['p:last-of-type', (e) => e.tag === 'p' && posTypeLast(e) === 1],
  ['h1, h2, h3', (e) => ['h1', 'h2', 'h3'].includes(e.tag)],
  ['table td, table th', (e) => (e.tag === 'td' || e.tag === 'th') && anc(e, (p) => p.tag === 'table')],
  ['tbody > tr:nth-child(even) > td:first-child', (e) => e.tag === 'td' && pos(e) === 1 && e.parent.tag === 'tr' && pos(e.parent) % 2 === 0 && e.parent.parent.tag === 'tbody'],
  ['input[disabled]', (e) => e.tag === 'input' && a(e, 'disabled') !== undefined],
  ['label + input', (e) => e.tag === 'input' && prev(e)?.tag === 'label'],
  ['*', () => true],
  ['body > *', (e) => e.parent.tag === 'body'],
  ['td:empty', (e) => e.tag === 'td' && e.kids.length === 0],
  ['span.badge:not(.hidden)', (e) => e.tag === 'span' && cls(e, 'badge') && !cls(e, 'hidden')],
  ['a[href="#top"]', (e) => e.tag === 'a' && a(e, 'href') === '#top'],
  [':is(h2, h3) + p', (e) => e.tag === 'p' && ['h2', 'h3'].includes(prev(e)?.tag)],
  ['[data-kind="NOTE" i]', (e) => (a(e, 'data-kind') ?? '').toLowerCase() === 'note'],
  ['section.alt > h1', (e) => e.tag === 'h1' && e.parent.tag === 'section' && cls(e.parent, 'alt')],
  ['article.archived li a', (e) => e.tag === 'a' && anc(e, (p) => p.tag === 'li' && anc(p, (q) => q.tag === 'article' && cls(q, 'archived')))],
  ['footer a', (e) => e.tag === 'a' && anc(e, (p) => p.tag === 'footer')],
  ['nonexistent', () => false],
]
export const cases = selectors.map(([selector, pred]) => ({ input: { html, selector }, expected: all.filter(pred).map((e) => e.n) }))
// Elements (an object with attribs, or with attributes) or plain numbers.
const number = (x) => typeof x === 'number' ? x : Number((x.attribs ?? x.attrs ?? {})['data-n'])
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    assert.ok(Array.isArray(outputs[i]), `fixture ${i}: list of elements required`)
    assert.deepEqual(outputs[i].map(number), expected, `fixture ${i}: ${input.selector}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length
