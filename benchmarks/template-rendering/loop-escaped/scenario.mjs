import { strict as assert } from 'node:assert'
const names = ['Widget', 'Tom & Jerry <b>', 'say "hi"', "it's here", 'Already &amp; escaped &#39;', 'café 日本語 😀', 'a=b `c` x+y/z', '<script>alert(1)</script>', 'Plain item']
const notes = ['', 'Fragile', '5 < 6 && 7 > 3', 'He said "no"', '', "O'Brien's", 'São Paulo ☕', '']
const tagPool = ['new', 'sale & clearance', '<hot>', '"quoted"', "it's", 'naïve', '日本語', 'x>y', 'plain']
const titles = ['Catalog', 'Tom & Jerry\'s "Shop"', '<Weekly> Report', 'Café Menu 日本語']
const authors = ['Ann Lee', 'O\'Neil & Sons', '"Quoted" <Author>', 'José Núñez']
const record = (i, j) => ({
  id: i * 100 + j,
  name: `${names[(i + j) % names.length]} ${j}`,
  price: 100 + ((i * 37 + j * 91) % 9000),
  featured: (i + j) % 3 === 0,
  note: notes[(i * 3 + j) % notes.length],
  tags: Array.from({ length: (i + j) % 4 }, (_, k) => tagPool[(i + j + k * 2) % tagPool.length]),
})
const sizes = [3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60]
const data = (i) => {
  const items = Array.from({ length: sizes[i % sizes.length] + (i % 3) }, (_, j) => record(i, j))
  return { title: titles[i % titles.length] + ` ${i}`, author: authors[i % authors.length], count: items.length, items }
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const reference = (d) => `<section title="${esc(d.title)}"><h1>${esc(d.title)}</h1><p>By ${esc(d.author)}</p><ul>` +
  d.items.map((it) => `<li id="item-${it.id}" class="item${it.featured ? ' featured' : ''}" title="${esc(it.name)}"><b>${esc(it.name)}</b> <span>${it.price}</span>` +
    `${it.note ? `<em>${esc(it.note)}</em>` : ''}${it.tags.map((t) => `<i>${esc(t)}</i>`).join('')}</li>`).join('\n') +
  `</ul><p>${d.count} items</p></section>`
// Entities are canonicalized so that equivalent spellings agree. The five
// characters stay as entities; optional escapes (= ` + /) decode to the character.
const five = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const normalize = (s) => s
  .replace(/&(?:#x([0-9a-f]+)|#(\d+)|(amp|lt|gt|quot|apos));/gi, (m, hex, dec, name) => {
    const ch = name ? named[name.toLowerCase()] : String.fromCodePoint(hex ? parseInt(hex, 16) : parseInt(dec, 10))
    return five[ch] ?? ('=`+/'.includes(ch) ? ch : m)
  })
  .replace(/\s+/g, ' ').replace(/> </g, '><').trim()
export const cases = Array.from({ length: 40 }, (_, i) => {
  const input = data(i)
  return { input, expected: normalize(reference(input)) }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(normalize(outputs[i]), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
