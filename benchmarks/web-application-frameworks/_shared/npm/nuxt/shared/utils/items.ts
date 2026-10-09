// The data of the sample application: an item is computed from its id.
const TAGS = ['alpha', 'beta', 'gamma', 'delta']
const priceCents = (id: number) => 199 + ((id * 37) % 5000)

export const price = (cents: number) => `$${(cents / 100).toFixed(2)}`

export function getItem(id: number) {
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
