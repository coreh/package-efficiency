import { strict as assert } from 'node:assert'
const skus = ['A-100', 'B&B-7', '<X>-1', 'q"uote', "it's-9", 'ÜBER-3', 'plain', 'Z=1+2']
const names = ['Widget', 'Tom & Jerry <b>', 'say "hi"', "it's here", 'Already &amp; escaped &#39;', 'café 日本語 😀', 'a=b `c` x+y/z', '<script>alert(1)</script>', 'Plain item']
const reasons = ['Customer asked', 'Deadline < Friday', 'VIP & friends', 'Said "now"', "O'Brien's order", 'São Paulo ☕']
const titles = ['Invoice', 'Tom & Jerry\'s "Shop"', '<Weekly> Invoice', 'Café 日本語']
const cities = ['Lisbon', 'São Paulo', 'Köln', 'Rock & Roll City', '<Nowhere>', "O'Fallon"]
const sizes = [5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 65, 80]
const data = (i) => {
  const rows = Array.from({ length: sizes[i % sizes.length] + (i % 4) }, (_, j) => ({
    sku: `${skus[(i + j) % skus.length]}-${j}`,
    name: `${names[(i * 2 + j) % names.length]} ${j}`,
    qty: 1 + ((i * 5 + j * 3) % 9),
    price: 50 + ((i * 53 + j * 117) % 900),
    rush: (i + j) % 4 === 0,
    reason: reasons[(i + j * 2) % reasons.length],
  }))
  return {
    title: `${titles[i % titles.length]} ${i}`,
    customer: { name: `Customer ${i} & Co <${i}>`, email: `user${i}@example.com`, address: { city: cities[i % cities.length] } },
    rows,
    footer: i % 2 ? 'Thanks, "come" again' : 'Terms: 30 days & no returns',
    total: rows.reduce((s, r) => s + r.qty * r.price, 0),
  }
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const reference = (d) => `<article><h1>${esc(d.title)}</h1><address>${esc(d.customer.name)} &lt;${esc(d.customer.email)}&gt;, ${esc(d.customer.address.city)}</address><table>` +
  d.rows.map((r) => `<tr class="row${r.rush ? ' rush' : ''}"><td>${esc(r.sku)}</td><td>${esc(r.name)}</td><td>${r.qty}</td><td>${r.price}</td><td>${r.rush ? 'Rush: ' + esc(r.reason) : 'Standard'}</td></tr>`).join('\n') +
  `</table><footer>${esc(d.footer)} - ${d.total}</footer></article>`
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
