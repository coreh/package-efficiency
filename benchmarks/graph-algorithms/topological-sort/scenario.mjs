import { strict as assert } from 'node:assert'
// An input is { nodes, edges }: node names, and [before, after] pairs of
// names. The graph has no cycle. Nodes are listed in an order that is not a
// valid answer, and some have no edge at all.
const build = (seed, count, fanout) => {
  let s = (seed * 2654435761) >>> 0
  const next = (n) => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) >>> 9) % n
  // rank[i] is the hidden position of node i; every edge goes from a lower rank to a higher one.
  const byRank = Array.from({ length: count }, (_, i) => i)
  for (let i = count - 1; i > 0; i--) { const j = next(i + 1); [byRank[i], byRank[j]] = [byRank[j], byRank[i]] }
  const name = (i) => `pkg-${seed}-${i}`
  const edges = [], seen = new Set()
  for (let r = 1; r < count; r++) {
    if (next(10) === 0) continue // no incoming edge
    for (let k = 1 + next(fanout); k > 0; k--) {
      // mostly recent nodes, as in a dependency graph, sometimes a far one
      const from = next(4) === 0 ? next(r) : Math.max(0, r - 1 - next(Math.min(r, 12)))
      const key = from * count + r
      if (!seen.has(key)) { seen.add(key); edges.push([name(byRank[from]), name(byRank[r])]) }
    }
  }
  for (let i = edges.length - 1; i > 0; i--) { const j = next(i + 1); [edges[i], edges[j]] = [edges[j], edges[i]] }
  return { input: { nodes: Array.from({ length: count }, (_, i) => name(i)), edges } }
}
const shapes = [[20, 2], [60, 3], [150, 3], [400, 4], [900, 3], [2000, 4], [35, 5], [100, 2], [250, 5], [600, 3], [1400, 4], [3000, 3]]
export const cases = shapes.map(([count, fanout], i) => build(i + 1, count, fanout))

// A graph has many valid orders and every library picks its own. Any order is
// accepted that lists each node exactly once and puts every edge's first node
// before its second.
export const verifyOne = (i, output) => {
  const { nodes, edges } = cases[i].input
  assert.ok(Array.isArray(output), `fixture ${i}: a list of node names is required`)
  assert.equal(output.length, nodes.length, `fixture ${i}: the order must list every node once`)
  const position = new Map(output.map((name, k) => [name, k]))
  assert.equal(position.size, nodes.length, `fixture ${i}: a node is listed twice`)
  for (const name of nodes) assert.ok(position.has(name), `fixture ${i}: ${name} is missing from the order`)
  for (const [before, after] of edges) assert.ok(position.get(before) < position.get(after), `fixture ${i}: ${before} must come before ${after}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
// The fixtures must not be solved by returning the node list, or its reverse.
for (const i of cases.keys()) for (const order of [cases[i].input.nodes, [...cases[i].input.nodes].reverse()]) assert.throws(() => verifyOne(i, order))
