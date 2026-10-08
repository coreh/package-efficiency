import { strict as assert } from 'node:assert'

// --- Reference --------------------------------------------------------------
// A small RFC 6902 / RFC 6901 implementation, used only to compute the expected
// value of each fixture (and to assert that a fixture is what it says it is).
// It returns null when the patch fails, which is the task's result for a patch
// that cannot be applied. No package's output is ever the expected value.

const unescape = (token) => token.replace(/~1/g, '/').replace(/~0/g, '~')
const tokens = (pointer) => {
  if (pointer === '') return []
  assert.ok(pointer.startsWith('/'), `bad pointer ${pointer}`)
  return pointer.slice(1).split('/').map(unescape)
}
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const index = (token, length, allowEnd) => {
  if (allowEnd && token === '-') return length
  if (!/^(?:0|[1-9]\d*)$/.test(token)) return -1
  const n = Number(token)
  return n < length || (allowEnd && n === length) ? n : -1
}
class PatchError extends Error {}
const fail = (message) => { throw new PatchError(message) }
const parent = (root, path) => {
  const t = tokens(path)
  if (t.length === 0) fail('root')
  let node = root
  for (const token of t.slice(0, -1)) {
    if (Array.isArray(node)) { const i = index(token, node.length, false); if (i < 0) fail('missing'); node = node[i] }
    else if (isObject(node) && Object.hasOwn(node, token)) node = node[token]
    else fail('missing')
  }
  return [node, t.at(-1)]
}
const read = (root, path) => {
  const [node, token] = parent(root, path)
  if (Array.isArray(node)) { const i = index(token, node.length, false); if (i < 0) fail('missing'); return node[i] }
  if (isObject(node) && Object.hasOwn(node, token)) return node[token]
  return fail('missing')
}
const insert = (root, path, value) => {
  const [node, token] = parent(root, path)
  if (Array.isArray(node)) { const i = index(token, node.length, true); if (i < 0) fail('index'); node.splice(i, 0, value) }
  else if (isObject(node)) node[token] = value
  else fail('scalar')
}
const take = (root, path) => {
  const [node, token] = parent(root, path)
  if (Array.isArray(node)) { const i = index(token, node.length, false); if (i < 0) fail('missing'); return node.splice(i, 1)[0] }
  if (isObject(node) && Object.hasOwn(node, token)) { const v = node[token]; delete node[token]; return v }
  return fail('missing')
}
const equal = (a, b) => { try { assert.deepStrictEqual(a, b); return true } catch { return false } }

export const reference = (document, patch) => {
  const doc = structuredClone(document)
  try {
    for (const op of patch) {
      if (op.op === 'add') insert(doc, op.path, structuredClone(op.value))
      else if (op.op === 'remove') take(doc, op.path)
      else if (op.op === 'replace') { take(doc, op.path); insert(doc, op.path, structuredClone(op.value)) }
      else if (op.op === 'move') insert(doc, op.path, take(doc, op.from))
      else if (op.op === 'copy') insert(doc, op.path, structuredClone(read(doc, op.from)))
      else if (op.op === 'test') { if (!equal(read(doc, op.path), op.value)) fail('test') }
      else throw new Error(`unknown op ${op.op}`)
    }
  } catch (error) {
    if (error instanceof PatchError) return null
    throw error
  }
  return doc
}

// --- Documents --------------------------------------------------------------

const cities = ['São Paulo', 'Porto Alegre', 'Zürich', 'Kraków', 'Osaka', 'Lagos']
const colors = ['red', 'green', 'blue', 'black', 'white']
const document = (i) => ({
  id: 1000 + i,
  name: `Order ${i} · café`,
  status: 'open',
  tags: ['new', 'priority', 'web', 'gift', 'fragile', 'eu'].slice(0, 4 + (i % 3)),
  customer: {
    name: `Customer ${i}`,
    email: `customer${i}@example.com`,
    address: { street: `${10 + i} Rua das Flores`, city: cities[i % cities.length], zip: String(10000 + i * 37), geo: { lat: -23.5 + i / 4, lng: -46.25 - i / 8 } },
    'ünï': 'ok',
    vip: i % 4 === 0,
  },
  items: Array.from({ length: 8 + (i % 9) }, (_, j) => ({
    sku: `SKU-${i}-${j}`,
    qty: j + 1,
    price: j * 3 + 0.5,
    attrs: { color: colors[(i + j) % colors.length], size: ['S', 'M', 'L'][j % 3] },
    notes: j % 3 ? null : 'gift wrap',
  })),
  meta: { 'a/b': i, 'm~n': 'tilde', draft: { by: `user${i}`, rev: i % 7 }, flags: { x: true, y: false } },
  history: Array.from({ length: 5 }, (_, j) => ({ at: 1700000000 + i * 100 + j, event: ['created', 'paid', 'packed', 'shipped', 'closed'][j] })),
})

// --- Patches ----------------------------------------------------------------
// Operations are chosen by the fixture number. Every fixture mixes add, remove,
// replace, move, copy and test; pointers use array indexes, "-", and the ~0 and
// ~1 escapes; values include null, nested objects and non-ASCII text.

const patch = (i) => {
  const ops = [
    { op: 'test', path: '/id', value: 1000 + i },
    { op: 'replace', path: '/name', value: `Order ${i} (rev) · ação` },
    { op: 'add', path: '/items/-', value: { sku: `NEW-${i}`, qty: 1, price: 5.5, attrs: {}, notes: null } },
    { op: 'add', path: `/items/${i % 4}`, value: { sku: `INS-${i}`, qty: 2, price: 7.25, attrs: { color: 'red' }, notes: 'inserted' } },
    { op: 'remove', path: `/items/${2 + (i % 3)}` },
    { op: 'replace', path: '/items/0/qty', value: 50 + i },
    { op: 'add', path: '/items/0/attrs/engraving', value: { text: 'ǿ ☃', lines: [1, 2, null] } },
    { op: 'remove', path: '/tags/0' },
    { op: 'add', path: '/tags/1', value: 'inserted' },
    { op: 'move', from: '/meta/draft', path: '/meta/published' },
    { op: 'copy', from: '/items/0', path: '/featured' },
    { op: 'replace', path: '/featured/qty', value: 999 },
    { op: 'replace', path: '/meta/a~1b', value: -i },
    { op: 'add', path: '/meta/m~0n2', value: [true, false, 'x'] },
    { op: 'remove', path: '/customer/address/geo' },
    { op: 'replace', path: '/customer/ünï', value: 'ǿ' },
    { op: 'add', path: '/customer/phone', value: null },
    { op: 'test', path: '/customer/address/zip', value: String(10000 + i * 37) },
    { op: 'test', path: '/meta/flags', value: { y: false, x: true } },
    { op: 'move', from: '/tags/0', path: '/tags/2' },
    { op: 'copy', from: '/history/4', path: '/history/-' },
    { op: 'remove', path: '/history/0' },
    { op: 'replace', path: '/status', value: 'paid' },
  ]
  // Keep about two thirds of the 23, rotating which; the operations at 0, 1, 2, 9, 10 and 11 are always kept.
  const keep = new Set([0, 1, 2, 9, 10, 11])
  for (let k = 0; k < ops.length; k++) if ((k + i) % 3 !== 0) keep.add(k)
  return ops.filter((_, k) => keep.has(k))
}

// A patch that cannot be applied: the failing operation comes last, after
// operations that do change the document, so a library that stops half way
// and returns the partial document is told apart from one that rejects it.
const failing = [
  { op: 'test', path: '/status', value: 'closed' },
  { op: 'remove', path: '/customer/fax' },
  { op: 'replace', path: '/customer/phone2', value: 'x' },
  { op: 'add', path: '/items/99', value: {} },
  { op: 'move', from: '/meta/nothing', path: '/meta/other' },
  { op: 'test', path: '/items/0/qty', value: '1' },
]

const count = 36
const raw = Array.from({ length: count }, (_, i) => {
  const doc = document(i)
  let ops = patch(i)
  const broken = i % 6 === 5
  if (broken) ops = [...ops, failing[(i - 5) / 6]]
  const expected = reference(doc, ops)
  assert.equal(expected === null, broken, `fixture ${i}: reference result does not match its kind`)
  if (!broken) assert.ok(!equal(expected, doc), `fixture ${i}: patch changes nothing`)
  return { doc, ops, expected }
})

// Documents and patches are given as JSON text, and the result is JSON text
// (or null for a patch that fails), so every adapter does the same work: read
// both, apply, write.
export const cases = raw.map(({ doc, ops, expected }) => ({
  input: { document: JSON.stringify(doc, null, i2(doc)), patch: JSON.stringify(ops) },
  expected,
}))
function i2(doc) { return doc.id % 2 ? 2 : undefined }

// --- Verification -----------------------------------------------------------

export const verifyOne = (i, output) => {
  const { expected } = cases[i]
  if (expected === null) { assert.equal(output, null, `fixture ${i}: a patch that cannot be applied must give null`); return }
  assert.equal(typeof output, 'string', `fixture ${i}: the patched document must be JSON text`)
  assert.deepStrictEqual(JSON.parse(output), expected, `fixture ${i}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  outputs.forEach((output, i) => verifyOne(i, output))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (value === null ? 0 : value.length)

// Proofs that the check can fail: the input document unchanged, and the patched
// document of the previous fixture, are both rejected.
assert.throws(() => verifyOne(0, cases[0].input.document), /fixture 0/)
assert.throws(() => verifyOne(1, JSON.stringify(cases[0].expected)), /fixture 1/)
assert.throws(() => verifyOne(5, JSON.stringify(document(5))), /fixture 5/)
