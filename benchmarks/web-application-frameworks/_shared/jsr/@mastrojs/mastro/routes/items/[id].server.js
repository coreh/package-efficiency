import { getParams, html, htmlToResponse } from '@mastrojs/mastro'
import { Layout } from '../../lib/Layout.js'
import { item, price } from '../../lib/items.js'

export const GET = (req) => {
  const it = item(Number(getParams(req).id))
  return htmlToResponse(
    Layout({
      title: it.name,
      children: html`<main id="bench" data-item=${it.id}>
  <h1>${it.name}</h1>
  <p class="price">${price(it.priceCents)}</p>
  ${it.inStock ? html`<p class="stock">In stock</p>` : html`<p class="stock out">Sold out</p>`}
  ${it.discountPercent ? html`<p class="discount">Save ${it.discountPercent}%</p>` : ''}
  <p class="note">${it.note}</p>
  <ul class="tags">${it.tags.map((tag) => html`<li>${tag}</li>`)}</ul>
  <table class="related">
    <thead><tr><th>Item</th><th>Price</th></tr></thead>
    <tbody>${it.related.map((r) => html`<tr><td><a href=${'/items/' + r.id}>${r.name}</a></td><td>${price(r.priceCents)}</td></tr>`)}</tbody>
  </table>
  <footer hidden>rendered</footer>
</main>`,
    }),
  )
}
