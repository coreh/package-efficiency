// The sample application with no framework: Bun.serve and string templates.
// The same application as ../node-http, on Bun's own server and its `routes`
// table.

const TAGS = ['alpha', 'beta', 'gamma', 'delta']
const priceCents = (id) => 199 + ((id * 37) % 5000)
const price = (cents) => `$${(cents / 100).toFixed(2)}`
const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function item(id) {
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

const layout = (title, main) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escape(title)}</title></head><body>${main}</body></html>`

const ABOUT = layout('About this shop', `<main id="bench"><h1>About this shop</h1><p>This page is the same for every visitor.</p><ul class="facts"><li>One static page</li><li>One dynamic page</li><li>One API route</li></ul></main>`)

function itemPage(it) {
  return layout(it.name, `<main id="bench" data-item="${it.id}"><h1>${escape(it.name)}</h1><p class="price">${price(it.priceCents)}</p>${it.inStock ? '<p class="stock">In stock</p>' : '<p class="stock out">Sold out</p>'}${it.discountPercent ? `<p class="discount">Save ${it.discountPercent}%</p>` : ''}<p class="note">${escape(it.note)}</p><ul class="tags">${it.tags.map((tag) => `<li>${escape(tag)}</li>`).join('')}</ul><table class="related"><thead><tr><th>Item</th><th>Price</th></tr></thead><tbody>${it.related.map((r) => `<tr><td><a href="/items/${r.id}">${escape(r.name)}</a></td><td>${price(r.priceCents)}</td></tr>`).join('')}</tbody></table><footer hidden>rendered</footer></main>`)
}

const html = { 'content-type': 'text/html; charset=utf-8' }
const notFound = () => new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } })
const digits = /^\d+$/

export function start() {
  const server = Bun.serve({
    port: 0,
    hostname: '127.0.0.1',
    routes: {
      '/about': { GET: () => new Response(ABOUT, { headers: html }) },
      '/items/:id': { GET: (request) => (digits.test(request.params.id) ? new Response(itemPage(item(Number(request.params.id))), { headers: html }) : notFound()) },
      '/api/items/:id': { GET: (request) => (digits.test(request.params.id) ? Response.json(item(Number(request.params.id))) : notFound()) },
    },
    fetch: notFound,
  })
  return { port: server.port, close: () => server.stop(true) }
}
