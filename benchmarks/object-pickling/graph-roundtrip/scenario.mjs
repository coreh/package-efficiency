import { strict as assert } from 'node:assert'
// Three graphs of 2,000 Node instances each, built from a tree (parent and
// children point at each other: a cycle), with Group objects and tag lists
// shared by many nodes, and some nodes that refer to themselves.
let seed = 12345
const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return Math.floor(seed / 65536) % n }
const words = ['alpha', 'βeta', 'gamma', 'δelta', 'café', '日本語', 'São Paulo', 'x']
const N = 2000
const graph = (shape) => {
  const tagSets = Array.from({ length: 40 }, (_, k) => Array.from({ length: 1 + (k % 5) }, (_, j) => words[(k + j) % words.length] + k))
  const groups = Array.from({ length: 25 }, (_, g) => ({ name: 'group-' + g + words[g % words.length], level: g % 4, lead: 0 }))
  const nodes = Array.from({ length: N }, (_, i) => ({
    id: i,
    name: `Node ${i} ${words[i % words.length]}`,
    score: Math.round((i / 7 + 0.5) * 1000) / 1000,
    pos: [i % 97, -(i % 31) - 1],
    tags: rnd(tagSets.length),
    group: rnd(groups.length),
    parent: i === 0 ? -1 : shape === 0 ? (i - 1) >> 1 : shape === 1 ? Math.floor((i - 1) / 3) : rnd(i),
    selfRef: i % 7 === 3,
  }))
  for (const g of groups) g.lead = rnd(N)
  return { tagSets, groups, nodes }
}
export const cases = [0, 1, 2].map((shape) => ({ input: graph(shape) }))
// The truth, from the fixture alone: what describe must report for the
// restored graph. Identity is reported as an index into the restored
// graph's own lists, so a copy of a shared object would show as -1 or as a
// different index.
const expectedFor = (g) => {
  const children = g.nodes.map(() => [])
  for (const n of g.nodes) if (n.parent >= 0) children[n.parent].push(n.id)
  return {
    sameAsInput: false,
    distinctNodes: true,
    distinctGroups: true,
    distinctTagSets: true,
    nodes: g.nodes.map((n) => ({ cls: 'Node', id: n.id, name: n.name, score: n.score, pos: n.pos, posType: 'tuple', tags: n.tags, group: n.group, parent: n.parent, children: children[n.id], selfRef: n.selfRef })),
    groups: g.groups.map((x) => ({ cls: 'Group', name: x.name, level: x.level, lead: x.lead })),
    tagSets: g.tagSets,
  }
}
const expected = cases.map(({ input }) => expectedFor(input))
export const verifyOne = (i, output) => {
  assert.ok(output !== null && typeof output === 'object', `fixture ${i}: description required`)
  assert.equal(output.sameAsInput, false, `fixture ${i}: the input graph itself was returned`)
  assert.deepStrictEqual(output, expected[i], `fixture ${i}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs) && outputs.length === cases.length, 'one output per fixture is required')
  outputs.forEach((output, i) => verifyOne(i, output))
}
// Sanity of the check itself: a graph with a copied shared group must differ.
{
  const bad = structuredClone(expected[0]); bad.nodes[5].group = -1
  assert.throws(() => assert.deepStrictEqual(bad, expected[0]))
  assert.ok(expected[0].nodes.length === N && expected[2].nodes.some((n) => n.children.length > 3))
}
export const verify = () => { throw new Error('Python-only task: no JavaScript adapters') }
export const consume = () => 1
