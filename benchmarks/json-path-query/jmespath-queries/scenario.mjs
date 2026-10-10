import { strict as assert } from 'node:assert'

// --- Documents --------------------------------------------------------------
// A bookstore (books with prices, years, tags, an optional isbn), people (one
// without an address), orders with line items, and a ragged matrix for
// flattening. Three sizes. Everything is deterministic.
//
// Prices, years and titles are distinct within a document, so sort_by,
// max_by and min_by never meet a tie (go-jmespath's sort is not stable).

const categories = ['fiction', 'reference', 'poetry', 'science']
const words = ['Atlas', 'Brume', 'Café', 'Dune', 'Écume', 'Fable', 'Garnet', 'Halo', 'Ívy', 'Jade']
const cities = ['Zürich', 'Porto', 'Kraków', 'Osaka', 'Lima']
const statuses = ['shipped', 'pending', 'cancelled']
const names = ['Ana', 'Bruno', 'Chiara', 'Dmitri', 'Eun-ji', 'Femi', 'Gaël', 'Hana', 'Ivo', 'Jun', 'Kofi', 'Lía']

const document = (i, books, people, orders) => ({
  store: {
    name: `The Corner Shelf ${i}`,
    open: i % 2 === 0,
    books: Array.from({ length: books }, (_, j) => ({
      title: `${words[(j + i) % words.length]} ${j}`,
      author: `Author ${(j * 7 + i) % 11}`,
      category: categories[(i + j) % 4],
      price: 3 + ((j * 13 + i) % books) / 2,
      year: 1960 + ((j * 11 + i * 5) % books),
      tags: ['a', 'b', 'c'].slice((i + j) % 2, 1 + ((i + j) % 3) + ((i + j) % 2)),
      ...(j % 3 === 0 ? { isbn: `978-${i}-${String(j).padStart(4, '0')}` } : {}),
      stock: { shelf: `S${j % 5}`, count: (j * 5 + i) % 9 },
    })),
  },
  people: Array.from({ length: people }, (_, k) => ({
    name: `${names[k % names.length]} ${k}`,
    age: 18 + ((k * 11 + i * 3) % 50),
    ...(k % 7 === 5 ? {} : { address: { city: cities[(i + k) % cities.length], zip: String(10000 + k * 37) } }),
    friends: Array.from({ length: (k + i) % 3 }, (_, f) => `${names[(k + f + 1) % names.length]} ${(k + f + 1) % people}`),
  })),
  orders: Array.from({ length: orders }, (_, k) => ({
    id: 1000 + k,
    status: statuses[(i + k) % 3],
    items: Array.from({ length: 1 + ((i + k) % 4) }, (_, m) => ({ sku: `SKU-${i}-${k}-${m}`, qty: 1 + ((m * 2 + k) % 5), price: m * 3 + 0.5 })),
  })),
  matrix: [[i, i + 1], [i + 2], [], [i + 3, [i + 4, i + 5]]],
  'odd key': { 'a.b': `dotted ${i}`, 'ünï': i },
})
const documents = [document(0, 8, 6, 4), document(1, 20, 12, 9), document(2, 40, 20, 16)]

// --- Reference --------------------------------------------------------------
// Each expression is written next to a direct JavaScript computation of its
// result, following the JMESPath specification: a projection leaves out the
// elements whose result is null, but keeps empty lists; a projection on a
// projection gives nested lists; `[]` flattens one level; a multiselect hash
// keeps a null value; `map` keeps nulls; a comparison with `<` or `>` is only
// made between numbers, and the fixtures only make it there.

const byKey = (key) => (a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0)
const sortBy = (list, key) => [...list].sort(byKey(key))
const sum = (list) => list.reduce((s, v) => s + v, 0)
const avg = (list) => sum(list) / list.length
const flatten = (list) => list.flatMap((v) => (Array.isArray(v) ? v : [v]))
const project = (list, f) => list.map(f).filter((v) => v !== null && v !== undefined)
const or = (v) => (v === undefined ? null : v)

const expressions = [
  ['store.name', (d) => d.store.name],
  ['store.books[0].title', (d) => d.store.books[0].title],
  ['store.books[-1].title', (d) => d.store.books.at(-1).title],
  ['store.books[*].title', (d) => d.store.books.map((b) => b.title)],
  ['store.books[1:4].price', (d) => d.store.books.slice(1, 4).map((b) => b.price)],
  ['store.books[::3].year', (d) => d.store.books.filter((_, j) => j % 3 === 0).map((b) => b.year)],
  ['store.books[::-1].title', (d) => [...d.store.books].reverse().map((b) => b.title)],
  ['store.books[?price < `6`].title', (d) => d.store.books.filter((b) => b.price < 6).map((b) => b.title)],
  ["store.books[?category == 'fiction'].author", (d) => d.store.books.filter((b) => b.category === 'fiction').map((b) => b.author)],
  ['store.books[?isbn].isbn', (d) => d.store.books.filter((b) => b.isbn).map((b) => b.isbn)],
  ['store.books[?!isbn].title', (d) => d.store.books.filter((b) => !b.isbn).map((b) => b.title)],
  ['store.books[?price > `5` && year >= `1962`].title', (d) => d.store.books.filter((b) => b.price > 5 && b.year >= 1962).map((b) => b.title)],
  ["store.books[?category == 'poetry' || category == 'science'].title", (d) => d.store.books.filter((b) => b.category === 'poetry' || b.category === 'science').map((b) => b.title)],
  ["store.books[?contains(tags, 'b')].title", (d) => d.store.books.filter((b) => b.tags.includes('b')).map((b) => b.title)],
  ['store.books[*].tags[0]', (d) => project(d.store.books, (b) => b.tags[0])],
  ['store.books[*].isbn', (d) => project(d.store.books, (b) => b.isbn)],
  ['map(&isbn, store.books)', (d) => d.store.books.map((b) => or(b.isbn))],
  ['store.books[:3].{t: title, p: price, s: stock.shelf}', (d) => d.store.books.slice(0, 3).map((b) => ({ t: b.title, p: b.price, s: b.stock.shelf }))],
  ['length(store.books)', (d) => d.store.books.length],
  ['sort_by(store.books, &price)[*].title', (d) => sortBy(d.store.books, (b) => b.price).map((b) => b.title)],
  ['reverse(sort_by(store.books, &title))[:5].title', (d) => sortBy(d.store.books, (b) => b.title).reverse().slice(0, 5).map((b) => b.title)],
  ['max_by(store.books, &year).title', (d) => sortBy(d.store.books, (b) => b.year).at(-1).title],
  ['min_by(store.books, &price).title', (d) => sortBy(d.store.books, (b) => b.price)[0].title],
  ['max(store.books[*].price)', (d) => Math.max(...d.store.books.map((b) => b.price))],
  ['sum(store.books[*].price)', (d) => sum(d.store.books.map((b) => b.price))],
  ['avg(people[*].age)', (d) => avg(d.people.map((p) => p.age))],
  ["join(', ', people[*].name)", (d) => d.people.map((p) => p.name).join(', ')],
  ['people[*].{name: name, city: address.city}', (d) => d.people.map((p) => ({ name: p.name, city: p.address ? p.address.city : null }))],
  ['people[*].address.city', (d) => project(d.people, (p) => (p.address ? p.address.city : null))],
  ['people[*].[name, age]', (d) => d.people.map((p) => [p.name, p.age])],
  ['people[?age > `40`].name | sort(@)', (d) => d.people.filter((p) => p.age > 40).map((p) => p.name).sort(byKey((s) => s))],
  ["people[?address.city == 'Zürich'].name", (d) => d.people.filter((p) => p.address && p.address.city === 'Zürich').map((p) => p.name)],
  ['people[].friends[]', (d) => d.people.flatMap((p) => p.friends)],
  ['matrix[]', (d) => flatten(d.matrix)],
  ['orders[*].items[*].sku', (d) => d.orders.map((o) => o.items.map((it) => it.sku))],
  ['orders[*].items[?qty > `3`].sku', (d) => d.orders.map((o) => o.items.filter((it) => it.qty > 3).map((it) => it.sku))],
  ["length(orders[?status == 'pending'])", (d) => d.orders.filter((o) => o.status === 'pending').length],
  ['{count: length(orders), qty: sum(orders[].items[].qty), last: orders[-1].items | [-1].sku}', (d) => ({ count: d.orders.length, qty: sum(d.orders.flatMap((o) => o.items.map((it) => it.qty))), last: d.orders.at(-1).items.at(-1).sku })],
  ["[type(store.open), to_string(store.books[0].year), starts_with(store.name, 'The'), contains(store.books[*].author, 'Author 3')]", (d) => ['boolean', String(d.store.books[0].year), d.store.name.startsWith('The'), d.store.books.some((b) => b.author === 'Author 3')]],
  ['[not_null(store.missing, store.name), store.missing, store.books[*].missing, "odd key"."a.b", sort(keys(store.books[0].stock))]', (d) => [d.store.name, null, [], d['odd key']['a.b'], Object.keys(d.store.books[0].stock).sort()]],
]

export const cases = documents.map((doc) => ({
  input: { document: doc, expressions: expressions.map(([expression]) => expression) },
  expected: expressions.map(([, compute]) => compute(doc)),
}))

// --- Verification -----------------------------------------------------------
// Each of the 40 results is compared exactly as a JSON value, in order. A
// multiselect hash is an object, whose key order is not compared. A number is
// compared by value (Go returns every number as a float).

export const verifyOne = (i, output) => {
  assert.ok(Array.isArray(output), `fixture ${i}: the result must be a list`)
  assert.equal(output.length, cases[i].expected.length, `fixture ${i}: one result per expression is required`)
  cases[i].input.expressions.forEach((expression, k) => {
    assert.deepStrictEqual(output[k], cases[i].expected[k], `fixture ${i}: ${expression}`)
  })
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  outputs.forEach((output, i) => verifyOne(i, output))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// --- The fixtures must be able to tell right from wrong ----------------------

const at = (expression) => expressions.findIndex(([e]) => e === expression)
assert.equal(expressions.length, 40)
assert.equal(new Set(expressions.map(([e]) => e)).size, 40, 'expressions are distinct')
for (const [i, { input, expected }] of cases.entries()) {
  const doc = input.document
  for (const key of ['price', 'year', 'title']) assert.equal(new Set(doc.store.books.map((b) => b[key])).size, doc.store.books.length, `fixture ${i}: book ${key}s are distinct`)
  assert.ok(doc.people.some((p) => !p.address), `fixture ${i}: one person has no address`)
  for (const [k, value] of expected.entries()) {
    assert.ok(value !== undefined, `fixture ${i}: ${expressions[k][0]} has a value`)
    if (Array.isArray(value)) assert.ok(value.length > 0, `fixture ${i}: ${expressions[k][0]} selects something`)
  }
  // Filters select some books and leave out others.
  for (const e of ['store.books[?price < `6`].title', "store.books[?category == 'fiction'].author", 'store.books[?isbn].isbn', 'store.books[?price > `5` && year >= `1962`].title', "store.books[?contains(tags, 'b')].title"]) {
    const n = expected[at(e)].length
    assert.ok(n > 0 && n < doc.store.books.length, `fixture ${i}: ${e} is selective (${n})`)
  }
  // The projection leaves out nulls, map keeps them, and the multiselect hash keeps them.
  assert.ok(expected[at('map(&isbn, store.books)')].includes(null))
  assert.ok(expected[at('people[*].{name: name, city: address.city}')].some((p) => p.city === null))
  assert.ok(expected[at('people[*].address.city')].length < doc.people.length)
  // Some orders have no item with qty > 3: the nested result keeps empty lists.
  const nested = expected[at('orders[*].items[?qty > `3`].sku')]
  assert.ok(nested.some((l) => l.length === 0) && nested.some((l) => l.length > 0), `fixture ${i}: nested filter has empty and non-empty lists`)
  // sort_by is not the input order.
  assert.notDeepStrictEqual(expected[at('sort_by(store.books, &price)[*].title')], expected[at('store.books[*].title')])
  assert.ok(expected[at('people[?age > `40`].name | sort(@)')].length > 1)
}
assert.deepStrictEqual(cases[0].expected[at('matrix[]')], [0, 1, 2, 3, [4, 5]])
assert.equal(cases.length, 3)

// Proofs that the check can fail: every result null, the list reversed,
// another fixture's results, a projection that keeps nulls, map that drops
// them, nested projections flattened, an unflattened matrix, a multiselect
// hash that drops a null member, and a sort_by that keeps input order.
const replaced = (i, expression, value) => cases[i].expected.map((v, k) => (k === at(expression) ? value : v))
const doc0 = cases[0].input.document
assert.throws(() => verifyOne(0, cases[0].expected.map(() => null)), /fixture 0/)
assert.throws(() => verifyOne(0, [...cases[0].expected].reverse()), /fixture 0/)
assert.throws(() => verifyOne(1, cases[0].expected), /fixture 1/)
assert.throws(() => verifyOne(0, cases[0].expected.slice(1)), /fixture 0/)
assert.throws(() => verifyOne(0, replaced(0, 'store.books[*].isbn', doc0.store.books.map((b) => or(b.isbn)))), /fixture 0/)
assert.throws(() => verifyOne(0, replaced(0, 'map(&isbn, store.books)', project(doc0.store.books, (b) => b.isbn))), /fixture 0/)
assert.throws(() => verifyOne(0, replaced(0, 'orders[*].items[*].sku', doc0.orders.flatMap((o) => o.items.map((it) => it.sku)))), /fixture 0/)
assert.throws(() => verifyOne(0, replaced(0, 'orders[*].items[?qty > `3`].sku', cases[0].expected[at('orders[*].items[?qty > `3`].sku')].filter((l) => l.length > 0))), /fixture 0/)
assert.throws(() => verifyOne(0, replaced(0, 'matrix[]', doc0.matrix)), /fixture 0/)
assert.throws(() => verifyOne(0, replaced(0, 'people[*].{name: name, city: address.city}', doc0.people.map((p) => (p.address ? { name: p.name, city: p.address.city } : { name: p.name })))), /fixture 0/)
assert.throws(() => verifyOne(0, replaced(0, 'sort_by(store.books, &price)[*].title', doc0.store.books.map((b) => b.title))), /fixture 0/)
assert.throws(() => verifyOne(0, replaced(0, 'avg(people[*].age)', avg(doc0.people.map((p) => p.age)) + 1)), /fixture 0/)
assert.throws(() => verifyOne(0, replaced(0, 'length(store.books)', String(doc0.store.books.length))), /fixture 0/)
