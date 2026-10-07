import { strict as assert } from 'node:assert'
// Layered service graph: layer 0 has no dependencies, each later service depends on
// one to three services of the layer below, and the root depends on the whole top layer.
const graph = (layers, width) => {
  const services = []
  const ids = (l) => Array.from({ length: width }, (_, j) => `svc-${l}-${j}`)
  for (let l = 0; l < layers; l++) {
    for (let j = 0; j < width; j++) {
      const prev = l === 0 ? [] : ids(l - 1)
      const deps = l === 0 ? [] : [...new Set([prev[j], prev[(j + 1) % width], prev[(j * 3 + 2) % width]].slice(0, 1 + ((l + j) % 3)))]
      services.push({ id: `svc-${l}-${j}`, deps })
    }
  }
  services.push({ id: 'root', deps: ids(layers - 1) })
  return { root: 'root', services }
}
const widths = [1, 2, 3, 4, 6, 8, 12, 16]
export const cases = Array.from({ length: 36 }, (_, i) => {
  const width = widths[i % widths.length]
  let layers = 3 + ((i * 7) % 18)
  if (layers * width > 299) layers = Math.floor(299 / width)
  return { input: graph(layers, width) }
})
cases.push({ input: { root: 'root', services: [{ id: 'root', deps: [] }] } })
const check = (output, { input }, label) => {
  const defs = new Map(input.services.map((s) => [s.id, s]))
  const seen = new Map()
  const stack = [output]
  while (stack.length) {
    const node = stack.pop()
    assert.ok(node && typeof node === 'object', `${label}: instance object required`)
    const def = defs.get(node.id)
    assert.ok(def, `${label}: unknown service ${node.id}`)
    if (seen.has(node.id)) { assert.equal(seen.get(node.id), node, `${label}: ${node.id} built twice`); continue }
    seen.set(node.id, node)
    assert.ok(Array.isArray(node.deps) && node.deps.length === def.deps.length, `${label}: ${node.id} deps`)
    node.deps.forEach((dep, k) => { assert.equal(dep.id, def.deps[k], `${label}: ${node.id} dep ${k}`); stack.push(dep) })
  }
  assert.equal(output.id, input.root, `${label}: root`)
  assert.equal(seen.size, defs.size, `${label}: every service must be reachable`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  cases.forEach((c, i) => check(outputs[i], c, `fixture ${i}`))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.deps.length + 1
