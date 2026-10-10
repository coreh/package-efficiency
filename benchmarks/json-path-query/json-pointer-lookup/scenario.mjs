import { strict as assert } from 'node:assert'

// --- Documents --------------------------------------------------------------
// A record with metadata, a list of line items (nested objects and arrays,
// non-ASCII strings, numbers, booleans, null) and an object whose keys need
// the ~0 and ~1 escapes, are empty, are digits or are not ASCII. Three sizes.
// Everything is deterministic.
//
// No key contains '^' (hana reads '^/' and '^^' as escapes of its own), and no
// pointer ends in two empty tokens: see task.md.

const colors = ['red', 'green', 'blue', 'ochre', 'teal']
const document = (i, items) => ({
  meta: { id: 100 + i, name: `Pedido nº ${i} · café`, tags: ['open', 'paid', 'rush'].slice(0, 1 + (i % 3)), created: `2026-0${1 + i}-1${i}` },
  items: Array.from({ length: items }, (_, j) => ({
    id: j,
    sku: `SKU-${i}-${j}`,
    name: `Artículo ${j} – ${colors[(i + j) % colors.length]}`,
    price: 2 + ((j * 7 + i * 3) % 40) / 2,
    qty: 1 + ((i + j) % 5),
    active: (i + j) % 3 !== 0,
    note: j % 4 === 0 ? null : `n${j}`,
    dims: { w: 10 + j, h: 20 + ((j * 3) % 7), unit: 'cm' },
    tags: colors.slice(0, 1 + ((i + j) % 4)),
  })),
  odd: {
    'a/b': `slash ${i}`,
    'm~n': `tilde ${i}`,
    '~1': `literal tilde-one ${i}`,
    '': { x: `empty-key child ${i}`, y: [i, i + 1, i + 2] },
    ' ': `space ${i}`,
    0: `zero key ${i}`,
    10: `ten key ${i}`,
    '50%': `percent ${i}`,
    'ünï cødé': `unicode ${i}`,
    'c%d': `c-percent-d ${i}`,
    'e\\f': `backslash ${i}`,
    'g"h': `quote ${i}`,
    'k l/m~n': [`mixed ${i}`, { deep: i }],
  },
})

// --- Reference --------------------------------------------------------------
// RFC 6901: a pointer is '' or a sequence of '/' + token; in a token '~1'
// stands for '/' and '~0' for '~', decoded in that order. A token selects an
// object member by name, or an array element by a decimal index without
// leading zeros. A pointer to nothing gives null here.

const encode = (tokens) => tokens.map((t) => '/' + String(t).replace(/~/g, '~0').replace(/\//g, '~1')).join('')
const decode = (token) => token.replace(/~1/g, '/').replace(/~0/g, '~')
export const resolve = (doc, pointer, decodeToken = decode) => {
  if (pointer === '') return doc
  assert.ok(pointer.startsWith('/'), `not a pointer: ${pointer}`)
  let node = doc
  for (const raw of pointer.slice(1).split('/')) {
    const token = decodeToken(raw)
    if (Array.isArray(node)) {
      if (!/^(0|[1-9][0-9]*)$/.test(token)) return null
      const index = Number(token)
      if (index >= node.length) return null
      node = node[index]
    } else if (node !== null && typeof node === 'object') {
      if (!Object.hasOwn(node, token)) return null
      node = node[token]
    } else {
      return null
    }
  }
  return node
}

// Every pointer that exists in a document, in document order (the root left out).
const allPaths = (node, prefix = [], out = []) => {
  const children = Array.isArray(node) ? node.map((v, k) => [k, v]) : node !== null && typeof node === 'object' ? Object.entries(node) : []
  for (const [key, value] of children) {
    const path = [...prefix, key]
    out.push(path)
    allPaths(value, path, out)
  }
  return out
}

// Pointers every fixture has: the escapes, the empty key, digit keys, and
// the whole document.
const special = [
  '',
  '/odd/a~1b',
  '/odd/m~0n',
  '/odd/~01',
  '/odd/',
  '/odd//x',
  '/odd//y/2',
  '/odd/ ',
  '/odd/0',
  '/odd/10',
  '/odd/k l~1m~0n/1/deep',
]
// Pointers to nothing: a missing member at the end and in the middle, an
// index past the end of an array at the end and in the middle, and escaped
// names that do not exist.
const missing = (doc) => [
  '/meta/missing',
  '/nope/deeper/still',
  `/items/${doc.items.length}`,
  `/items/${doc.items.length + 5}/sku`,
  '/items/0/nope',
  '/items/1/dims/depth',
  '/odd/a~1c',
  '/odd/~0~1',
  '/odd//z',
]
const POINTERS = 60

// Each fixture takes the special and missing pointers and fills the rest with
// existing pointers spread across the document, starting at an offset, then
// shuffles them with a fixed generator so kinds are interleaved.
const fixture = (doc, offset) => {
  const fixed = [...special, ...missing(doc)]
  const paths = allPaths(doc).map(encode).filter((p) => !fixed.includes(p))
  const count = POINTERS - fixed.length
  const step = paths.length / count
  const picked = Array.from({ length: count }, (_, k) => paths[(Math.floor(k * step) + offset) % paths.length])
  const pointers = [...fixed, ...picked]
  let seed = 0x9e3779b9 ^ (offset * 7919 + doc.items.length)
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32)
  for (let k = pointers.length - 1; k > 0; k--) {
    const r = Math.floor(random() * (k + 1))
    ;[pointers[k], pointers[r]] = [pointers[r], pointers[k]]
  }
  return { document: doc, pointers }
}

const documents = [document(0, 6), document(1, 16), document(2, 40)]
const inputs = documents.flatMap((doc) => [fixture(doc, 0), fixture(doc, 3)])

export const cases = inputs.map((input) => ({ input, expected: input.pointers.map((p) => resolve(input.document, p)) }))

// --- Verification -----------------------------------------------------------

export const verifyOne = (i, output) => {
  assert.ok(Array.isArray(output), `fixture ${i}: the result must be a list`)
  assert.equal(output.length, cases[i].expected.length, `fixture ${i}: one value per pointer is required`)
  cases[i].input.pointers.forEach((pointer, k) => {
    assert.deepStrictEqual(output[k], cases[i].expected[k], `fixture ${i}: pointer ${JSON.stringify(pointer)}`)
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

for (const [i, { input, expected }] of cases.entries()) {
  assert.equal(input.pointers.length, POINTERS, `fixture ${i}: ${POINTERS} pointers`)
  assert.equal(new Set(input.pointers).size, POINTERS, `fixture ${i}: pointers are distinct`)
  const nulls = input.pointers.filter((p, k) => expected[k] === null && !missing(input.document).includes(p))
  // Existing pointers that hold null (an item's note) are the only other nulls.
  assert.ok(nulls.every((p) => /\/note$/.test(p)), `fixture ${i}: unexpected missing pointer`)
  for (const p of missing(input.document)) assert.equal(resolve(input.document, p), null, `fixture ${i}: ${p} is missing`)
  for (const p of special) assert.notEqual(resolve(input.document, p), null, `fixture ${i}: ${p} exists`)
  for (const p of input.pointers) {
    assert.ok(!p.includes('^'), 'no pointer contains ^')
    assert.ok(!p.endsWith('//'), 'no pointer ends in two empty tokens')
  }
}
assert.equal(resolve(documents[0], '/odd/~01'), 'literal tilde-one 0')
assert.equal(resolve(documents[0], '/odd/k l~1m~0n/1/deep'), 0)
assert.equal(resolve(documents[1], '/items/2/tags/2'), 'blue')
assert.deepStrictEqual(resolve(documents[0], '/odd/'), documents[0].odd[''])
assert.equal(cases.length, 6)

// Proofs that the check can fail: every value null, the list reversed,
// another fixture's result, missing pointers reported as undefined-like
// sentinels, '~0' decoded before '~1', and an index read with leading zeros
// or a token read without decoding.
const wrongOrder = (token) => token.replace(/~0/g, '~').replace(/~1/g, '/')
const noDecode = (token) => token
assert.throws(() => verifyOne(0, cases[0].expected.map(() => null)), /fixture 0/)
assert.throws(() => verifyOne(0, [...cases[0].expected].reverse()), /fixture 0/)
assert.throws(() => verifyOne(1, cases[0].expected), /fixture 1/)
assert.throws(() => verifyOne(0, cases[0].expected.slice(1)), /fixture 0/)
assert.throws(() => verifyOne(0, cases[0].expected.map((v) => (v === null ? false : v))), /fixture 0/)
assert.throws(() => verifyOne(0, cases[0].expected.map((v) => (v === null ? {} : v))), /fixture 0/)
for (const decoder of [wrongOrder, noDecode]) {
  for (let i = 0; i < cases.length; i++) {
    assert.throws(() => verifyOne(i, cases[i].input.pointers.map((p) => resolve(cases[i].input.document, p, decoder))), new RegExp(`fixture ${i}`))
  }
}
// A resolver that does not tell the empty key from the parent object fails.
assert.throws(
  () => verifyOne(0, cases[0].input.pointers.map((p) => resolve(cases[0].input.document, p.endsWith('/') ? p.slice(0, -1) : p))),
  /fixture 0/,
)
