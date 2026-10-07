// A client task: see "Client tasks" in benchmarks/README.md. The peer is the
// scripted HTTP/1.1 origin (harness/rust/src/bin/http-peer.rs); it answers
// only the routes below and refuses, and records, anything else.
const item = (i) => ({
  id: 4100 + i,
  sku: `SKU-${String(7 * i + 3).padStart(5, '0')}`,
  name: ['Chave de fenda', 'Tornillo M4 × 12', 'Ruban adhésif', 'Lötzinn 0,5 mm', '六角レンチ', 'Washer set', 'Cable tie', 'Heat-shrink tube'][i],
  price: Number((4.25 + i * 3.5).toFixed(2)),
  inStock: i % 3 !== 0,
  discontinuedAt: null,
  tags: ['hardware', `bin-${i}`, ...(i % 2 ? ['metric'] : []), ...Array.from({ length: i }, (_, j) => `lot-${i}-${j}`)],
  dimensions: { widthMm: 12 + i, heightMm: 4.5 + i / 4, weightG: 30 * (i + 1) },
  supplier: { id: 90 + i, name: `Supplier ${i}`, contact: { email: `orders${i}@example.com`, phone: `+55 11 5550-01${String(i).padStart(2, '0')}` } },
  description: 'Sold per unit. '.repeat(1 + 2 * i).trim(),
})
const items = Array.from({ length: 8 }, (_, i) => item(i))

export const peer = {
  program: 'http',
  script: {
    keepAlive: true,
    routes: items.map((body) => ({ method: 'GET', path: `/items/${body.id}`, status: 200, contentType: 'application/json', body: JSON.stringify(body) })),
  },
}

// Fixture i performs exchange i of the peer's script. The input is what the
// adapter needs to ask; the expected result is the parsed document.
export const cases = items.map((body) => ({ input: { path: `/items/${body.id}` }, expected: body }))
