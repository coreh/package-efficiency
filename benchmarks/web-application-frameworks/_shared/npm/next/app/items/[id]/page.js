// The dynamic page: a Server Component rendered for every request.
import Link from 'next/link'
import { getItem, price } from '../../../lib/items.js'

export async function generateMetadata({ params }) {
  const { id } = await params
  return { title: getItem(Number(id)).name }
}

export default async function ItemPage({ params }) {
  const { id } = await params
  const item = getItem(Number(id))
  return (
    <main id="bench" data-item={item.id}>
      <h1>{item.name}</h1>
      <p className="price">{price(item.priceCents)}</p>
      {item.inStock ? <p className="stock">In stock</p> : <p className="stock out">Sold out</p>}
      {item.discountPercent ? <p className="discount">Save {item.discountPercent}%</p> : null}
      <p className="note">{item.note}</p>
      <ul className="tags">
        {item.tags.map((tag) => (
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
          {item.related.map((related) => (
            <tr key={related.id}>
              <td>
                <Link href={`/items/${related.id}`}>{related.name}</Link>
              </td>
              <td>{price(related.priceCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer hidden>rendered</footer>
    </main>
  )
}
