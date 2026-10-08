import { strict as assert } from 'node:assert'

// --- Documents --------------------------------------------------------------
// A catalog (books, one bicycle), a list of orders with line items, and a key
// that needs bracket notation. Three sizes. Everything is deterministic.

const categories = ['fiction', 'reference', 'poetry', 'science']
const cities = ['São Paulo', 'Porto Alegre', 'Zürich', 'Kraków', 'Osaka']
const document = (i, books, orders) => ({
  store: {
    book: Array.from({ length: books }, (_, j) => ({
      category: categories[(i + j) % 4],
      author: `Author ${(j * 7 + i) % 11}`,
      title: `Title ${i}-${j} · café`,
      price: 5 + ((j * 7 + i * 3) % 40) / 2,
      ...(j % 3 === 0 ? { isbn: `ISBN-${i}-${j}` } : {}),
      tags: ['a', 'b', 'c'].slice(0, 1 + ((i + j) % 3)),
    })),
    bicycle: { color: 'red', price: 399.5 },
  },
  'odd key': { 'ünï': i, 'a.b': 'dotted' },
  orders: Array.from({ length: orders }, (_, k) => ({
    id: 1000 + k,
    customer: { name: `Customer ${k}`, address: { city: cities[(i + k) % cities.length], zip: String(10000 + k * 37) } },
    items: Array.from({ length: 2 + ((i + k) % 4) }, (_, m) => ({ sku: `SKU-${i}-${k}-${m}`, qty: m + 1, price: m * 3 + 0.5 })),
  })),
  expensive: 10,
})
const documents = [document(0, 12, 4), document(1, 24, 8), document(2, 40, 12)]

// --- Reference --------------------------------------------------------------
// Each query is written next to a direct JavaScript computation of its result.
// A segment visits the nodes it is given in order, so the order of a result
// follows the document. RFC 9535 fixes less for a descendant search: a node
// comes before its descendants and array elements by index, but not whether
// the walk goes depth first or level by level. The reference below walks depth
// first; the one query that depends on it is compared without order.

const preorder = (node, visit) => {
  visit(node)
  if (Array.isArray(node)) node.forEach((child) => preorder(child, visit))
  else if (node !== null && typeof node === 'object') Object.values(node).forEach((child) => preorder(child, visit))
}
const descendantMembers = (root, name) => {
  const out = []
  preorder(root, (node) => {
    if (node !== null && typeof node === 'object' && !Array.isArray(node) && Object.hasOwn(node, name)) out.push(node[name])
  })
  return out
}

const queries = [
  ['$.store.book[*].author', (d) => d.store.book.map((b) => b.author)],
  ['$.store.book[0].title', (d) => [d.store.book[0].title]],
  ['$.store.book[-3:].title', (d) => d.store.book.slice(-3).map((b) => b.title)],
  ['$.store.book[1:4].price', (d) => d.store.book.slice(1, 4).map((b) => b.price)],
  ['$.store.book[?(@.price < 20)].title', (d) => d.store.book.filter((b) => b.price < 20).map((b) => b.title)],
  ["$.store.book[?(@.category == 'fiction')].author", (d) => d.store.book.filter((b) => b.category === 'fiction').map((b) => b.author)],
  ['$.store.bicycle.color', (d) => [d.store.bicycle.color]],
  ['$..price', (d) => descendantMembers(d, 'price'), 'unordered'],
  ['$..sku', (d) => descendantMembers(d, 'sku')],
  ['$.store.book[?(@.isbn)].isbn', (d) => d.store.book.filter((b) => 'isbn' in b).map((b) => b.isbn)],
  ['$.orders[*].items[*].sku', (d) => d.orders.flatMap((o) => o.items.map((it) => it.sku))],
  ['$.store.missing[*]', () => []],
  ['$.orders[?(@.id >= 1003)].customer.address.city', (d) => d.orders.filter((o) => o.id >= 1003).map((o) => o.customer.address.city)],
  ['$.orders[*].items[0:2].qty', (d) => d.orders.flatMap((o) => o.items.slice(0, 2).map((it) => it.qty))],
  ["$['odd key']['a.b']", (d) => [d['odd key']['a.b']]],
]

export const cases = documents.flatMap((doc) =>
  queries.map(([query, compute, order]) => ({ input: { document: doc, query }, expected: compute(doc), unordered: order === 'unordered' })),
)

// --- Verification -----------------------------------------------------------

// RFC 9535 fixes the order of a descendant search only in part: a node comes
// before its descendants and array elements come in index order, but a package
// may walk depth first or level by level. The one query whose answer depends on
// that ($..price) is compared as a multiset; every other query is compared in
// order.
const canonical = (list) => list.map((v) => JSON.stringify(v)).sort()
export const verifyOne = (i, output) => {
  assert.ok(Array.isArray(output), `fixture ${i}: the result must be a list`)
  const message = `fixture ${i}: ${cases[i].input.query}`
  if (cases[i].unordered) assert.deepStrictEqual(canonical(output), canonical(cases[i].expected), message)
  else assert.deepStrictEqual(output, cases[i].expected, message)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  outputs.forEach((output, i) => verifyOne(i, output))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// The fixtures must be able to tell right from wrong.
const nonEmpty = cases.filter((c) => c.expected.length > 0).length
assert.equal(nonEmpty, cases.length - documents.length, 'only the missing-member query is empty')
for (const doc of documents) assert.ok(descendantMembers(doc, 'price').length > doc.store.book.length, 'descendant search reaches nested prices')
assert.ok(queries.length * documents.length === 45)
// Proofs that the check can fail: an empty list, a reordered list, a result
// for the wrong query, and an unwrapped single value.
assert.throws(() => verifyOne(0, []), /fixture 0/)
assert.throws(() => verifyOne(0, [...cases[0].expected].reverse()), /fixture 0/)
assert.throws(() => verifyOne(1, cases[0].expected), /fixture 1/)
assert.throws(() => verifyOne(1, cases[1].expected[0]), /fixture 1/)
assert.throws(() => verifyOne(7, cases[7].expected.slice(1)), /fixture 7/)
assert.throws(() => verifyOne(8, [...cases[8].expected].reverse()), /fixture 8/)
