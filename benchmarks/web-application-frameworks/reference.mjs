// The sample application every framework implements, as plain functions: the
// data behind an item, and the HTML each page must contain. The tasks' request
// lists are made from this (see each task's scenario.mjs), and README.md
// states the same thing in words. An implementation is correct when its pages
// contain these fragments (compared as harness/html.mjs describes) and its
// API returns this data.
import { normalizeHtml } from '../../harness/html.mjs'

const TAGS = ['alpha', 'beta', 'gamma', 'delta']
const price = (cents) => `$${(cents / 100).toFixed(2)}`
const priceCents = (id) => 199 + ((id * 37) % 5000)

// The data of one item. Pure: the same id always gives the same item.
export function item(id) {
  return {
    id,
    name: `Item ${id}`,
    priceCents: priceCents(id),
    inStock: id % 3 !== 0,
    discountPercent: id % 5 === 0 ? 15 : 0,
    note: `Fish & Chips <${id}> "quoted" it's`,
    tags: TAGS.slice(0, (id % 4) + 1),
    related: Array.from({ length: 12 }, (_, i) => ({ id: id + i + 1, name: `Item ${id + i + 1}`, priceCents: priceCents(id + i + 1) })),
  }
}

const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// The dynamic page's element, from the template in README.md.
export function itemHtml(id) {
  const it = item(id)
  return `<main id="bench" data-item="${it.id}">
  <h1>${escape(it.name)}</h1>
  <p class="price">${price(it.priceCents)}</p>
  ${it.inStock ? '<p class="stock">In stock</p>' : '<p class="stock out">Sold out</p>'}
  ${it.discountPercent ? `<p class="discount">Save ${it.discountPercent}%</p>` : ''}
  <p class="note">${escape(it.note)}</p>
  <ul class="tags">${it.tags.map((tag) => `<li>${escape(tag)}</li>`).join('')}</ul>
  <table class="related">
    <thead><tr><th>Item</th><th>Price</th></tr></thead>
    <tbody>${it.related.map((r) => `<tr><td><a href="/items/${r.id}">${escape(r.name)}</a></td><td>${price(r.priceCents)}</td></tr>`).join('')}</tbody>
  </table>
  <footer hidden>rendered</footer>
</main>`
}

// The static page's element.
export const ABOUT_HTML = `<main id="bench">
  <h1>About this shop</h1>
  <p>This page is the same for every visitor.</p>
  <ul class="facts"><li>One static page</li><li>One dynamic page</li><li>One API route</li></ul>
</main>`

const page = (html) => ({ status: 200, type: 'text/html', fragment: { open: '<main id="bench"', close: '</main>', html: normalizeHtml(html) } })

// The ids the tasks ask for: spread so that every branch of the template is taken.
export const IDS = Array.from({ length: 32 }, (_, i) => 1 + i * 7)

// Every request says what a browser says about compression, so a framework
// that compresses by default does so here too.
const headers = { 'Accept-Encoding': 'gzip, deflate, br' }

export const staticRequests = [{ method: 'GET', path: '/about', headers, expect: page(ABOUT_HTML) }]
export const dynamicRequests = IDS.map((id) => ({ method: 'GET', path: `/items/${id}`, headers, expect: page(itemHtml(id)) }))
export const apiRequests = IDS.map((id) => ({ method: 'GET', path: `/api/items/${id}`, headers, expect: { status: 200, type: 'application/json', json: item(id) } }))
