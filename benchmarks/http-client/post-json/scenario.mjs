// A client task: see "Client tasks" in benchmarks/README.md. The peer is the
// scripted HTTP/1.1 origin (harness/rust/src/bin/http-peer.rs). It accepts a
// POST only if the body is, byte for byte, the route's document, sent with a
// Content-Length and `Content-Type: application/json`.
const order = (i) => ({
  customer: { id: 7300 + i, name: ['Ana Araújo', 'Jörg Weiß', 'Chloé Lefèvre', '山田 花子', 'Liam O’Brien', 'Zoë Smith', 'Иван Петров', 'Bao Nguyễn'][i], email: `customer${i}@example.com` },
  lines: Array.from({ length: 1 + i }, (_, j) => ({ sku: `SKU-${String(7 * j + i).padStart(5, '0')}`, quantity: 1 + ((i + j) % 4), unitPrice: Number((2.5 + j * 1.75).toFixed(2)) })),
  shipping: { method: i % 2 ? 'express' : 'standard', address: { street: `${10 + i} Rua das Flores`, city: 'São Paulo', postalCode: `0${1000 + i}-000`, country: 'BR' } },
  giftWrap: i % 3 === 0,
  coupon: null,
  note: 'Leave at the front desk. '.repeat(i).trim(),
})
const orders = Array.from({ length: 8 }, (_, i) => order(i))
const receipt = (i) => ({ id: 880000 + i * 13, status: 'accepted', lines: 1 + i, total: Number(orders[i].lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0).toFixed(2)), warnings: [] })

export const peer = {
  program: 'http',
  script: {
    keepAlive: true,
    routes: orders.map((body, i) => ({
      method: 'POST',
      path: `/orders/${i + 1}`,
      requestBody: JSON.stringify(body),
      requestContentType: 'application/json',
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(receipt(i)),
    })),
  },
}

// The body is prepared text, the same bytes for every adapter: serializing it
// is not part of this task. The expected result is the parsed receipt.
export const cases = orders.map((body, i) => ({ input: { path: `/orders/${i + 1}`, body: JSON.stringify(body) }, expected: receipt(i) }))
