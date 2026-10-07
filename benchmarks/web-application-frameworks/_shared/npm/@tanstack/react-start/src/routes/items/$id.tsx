import { createFileRoute } from '@tanstack/react-router'
import { item, price } from '../../item'

export const Route = createFileRoute('/items/$id')({
  loader: ({ params }) => item(Number(params.id)),
  component: ItemPage,
})

function ItemPage() {
  const it = Route.useLoaderData()
  return (
    <main id="bench" data-item={it.id}>
      <h1>{it.name}</h1>
      <p className="price">{price(it.priceCents)}</p>
      {it.inStock ? <p className="stock">In stock</p> : <p className="stock out">Sold out</p>}
      {it.discountPercent ? <p className="discount">Save {it.discountPercent}%</p> : null}
      <p className="note">{it.note}</p>
      <ul className="tags">
        {it.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      <table className="related">
        <thead>
          <tr>
            <th>Item</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {it.related.map((r) => (
            <tr key={r.id}>
              <td>
                <a href={`/items/${r.id}`}>{r.name}</a>
              </td>
              <td>{price(r.priceCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer hidden>rendered</footer>
    </main>
  )
}
