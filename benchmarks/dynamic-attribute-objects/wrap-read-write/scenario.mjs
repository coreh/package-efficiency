import { strict as assert } from 'node:assert'

// Deterministic generator (LCG). No clock, no randomness.
const rng = (seed) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296) }
const NAMES = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'sigma', 'theta', 'kappa', 'lambda', 'zeta', 'port', 'host', 'level', 'mode', 'limit', 'label', 'region', 'token']

// Every key is a snake_case word plus an index, so it is a valid method name
// that clashes with no method of Hash, Object, Hashie::Mash or OpenStruct.
const build = (seed, total, maxDepth, branching) => {
  const r = rng(seed)
  const leaves = [], nodes = []
  let count = 0
  const leaf = () => {
    const t = Math.floor(r() * 7)
    if (t === 0) return Math.floor(r() * 100000)
    if (t === 1) return Math.floor(r() * 4000) / 4 + 0.25
    if (t === 2) return r() < 0.5
    if (t === 3) return null
    if (t === 4) return [Math.floor(r() * 9), Math.floor(r() * 9), Math.floor(r() * 9)]
    return `v${Math.floor(r() * 1e6)} é "q"`
  }
  const fill = (obj, path, depth) => {
    const n = 2 + Math.floor(r() * branching)
    for (let i = 0; i < n && count < total; i++) {
      const key = `${NAMES[Math.floor(r() * NAMES.length)]}_${count}`
      count++
      if (depth < maxDepth && r() < 0.35) {
        obj[key] = {}
        nodes.push([...path, key])
        fill(obj[key], [...path, key], depth + 1)
      } else {
        obj[key] = leaf()
        leaves.push([...path, key])
      }
    }
  }
  const doc = {}
  while (count < total) fill(doc, [], 1)
  return { doc, leaves, nodes }
}
const get = (doc, path) => path.reduce((o, k) => o[k], doc)
const clone = (v) => JSON.parse(JSON.stringify(v))

const make = (seed, total, maxDepth, branching) => {
  const { doc, leaves, nodes } = build(seed, total, maxDepth, branching)
  const r = rng(seed + 7)
  const pick = (list) => list[Math.floor(r() * list.length)]
  const ops = []
  // 150 reads, 50 writes (40 replace a leaf, 10 add a key under an existing hash), 50 reads of what was written.
  for (let i = 0; i < 150; i++) ops.push(['r', pick(leaves)])
  const written = []
  for (let i = 0; i < 50; i++) {
    if (i % 5 === 4) {
      const parent = nodes.length ? pick(nodes) : []
      const path = [...parent, `added_${i}`]
      ops.push(['w', path, `new ${i}`]); written.push(path)
    } else {
      const path = pick(leaves)
      const v = i % 3 === 0 ? i * 31 + 5 : i % 3 === 1 ? `changed ${i} ü` : i % 2 === 0
      ops.push(['w', path, v]); written.push(path)
    }
  }
  for (let i = 0; i < 50; i++) ops.push(['r', pick(written)])
  // Expected result, computed with plain objects.
  const finalDoc = clone(doc), reads = []
  for (const [op, path, value] of ops) {
    if (op === 'r') reads.push(clone(get(finalDoc, path)))
    else get(finalDoc, path.slice(0, -1))[path.at(-1)] = value
  }
  return { input: { doc, ops }, expected: [reads, finalDoc], keys: total }
}

export const cases = [
  make(11, 1000, 3, 8),
  make(23, 1000, 6, 5),
  make(37, 1000, 2, 14),
  make(41, 1000, 8, 4),
]

const countKeys = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? Object.values(v).reduce((a, x) => a + 1 + countKeys(x), 0) : 0
const depthOf = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? 1 + Math.max(0, ...Object.values(v).map(depthOf)) : 0
for (const c of cases) {
  assert.ok(countKeys(c.input.doc) >= 1000, 'a document of at least 1,000 keys')
  assert.ok(depthOf(c.input.doc) >= 2)
  // The input unchanged is not an answer: writes must show in the final hash and in the reads.
  assert.notDeepEqual(c.expected[1], c.input.doc)
  assert.equal(c.input.ops.filter((o) => o[0] === 'r').length, 200)
  assert.equal(c.input.ops.filter((o) => o[0] === 'w').length, 50)
}
assert.ok(depthOf(cases[3].input.doc) >= 5, 'deep fixture')

export const verifyOne = (i, output) => {
  const { expected } = cases[i]
  assert.ok(Array.isArray(output) && output.length === 2, `fixture ${i}: [reads, hash] required`)
  assert.ok(Array.isArray(output[0]), `fixture ${i}: reads must be a list`)
  assert.equal(output[0].length, expected[0].length, `fixture ${i}: one value per read`)
  // Keys are compared as text (a symbol key arrives as its name in JSON); key order does not matter.
  assert.deepStrictEqual(output[0], expected[0], `fixture ${i}: values read`)
  assert.deepStrictEqual(output[1], expected[1], `fixture ${i}: hash converted back`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
