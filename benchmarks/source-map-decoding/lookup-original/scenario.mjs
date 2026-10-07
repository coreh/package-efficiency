import { strict as assert } from 'node:assert'

// Deterministic generator (no Math.random): a small linear congruential PRNG.
const rng = (seed) => { let s = seed >>> 0; return (n) => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s >>> 8) % n } }

// Independent base64 VLQ encoder used only to build the maps.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const vlq = (n) => {
  let v = n < 0 ? ((-n) << 1) | 1 : n << 1, out = ''
  do { let d = v & 31; v >>>= 5; if (v > 0) d |= 32; out += B64[d] } while (v > 0)
  return out
}

const identifiers = ['render', 'props', 'state', 'useEffect', 'handler', 'config', 'value', 'index', 'result', 'options', 'callback', 'node', 'ctx', 'items', 'total']
const dirs = ['src', 'src/components', 'src/lib', 'src/utils', 'node_modules/lodash', 'node_modules/react/cjs']

// Builds one map and keeps its absolute segments per generated line, for the expected answers.
const build = (seed, lineCount, density, sourceCount, nameCount) => {
  const r = rng(seed)
  const sources = Array.from({ length: sourceCount }, (_, i) => `${dirs[(i + seed) % dirs.length]}/module${i}.${i % 3 === 0 ? 'ts' : 'js'}`)
  const names = Array.from({ length: nameCount }, (_, i) => `${identifiers[(i + seed) % identifiers.length]}${i}`)
  const lines = []
  let mappings = ''
  let src = 0, oLine = 0, oCol = 0, name = 0
  for (let line = 0; line < lineCount; line++) {
    if (line > 0) mappings += ';'
    const segs = r(10) === 0 ? 0 : 1 + r(density)
    const list = []
    let genCol = 0, prevGen = 0, first = true
    for (let k = 0; k < segs; k++) {
      genCol += first ? r(6) : 1 + r(40)
      const nsrc = r(12) === 0 ? r(sourceCount) : src
      const nLine = Math.max(0, oLine + (r(4) === 0 ? r(21) - 10 : r(3)))
      const nCol = r(3) === 0 ? r(120) : oCol + 1 + r(30)
      const hasName = nameCount > 0 && r(3) === 0
      const nName = hasName ? r(nameCount) : name
      if (!first) mappings += ','
      mappings += vlq(genCol - prevGen) + vlq(nsrc - src) + vlq(nLine - oLine) + vlq(nCol - oCol) + (hasName ? vlq(nName - name) : '')
      list.push([genCol, sources[nsrc], nLine + 1, nCol, hasName ? names[nName] : null])
      prevGen = genCol; src = nsrc; oLine = nLine; oCol = nCol; if (hasName) name = nName
      first = false
    }
    lines.push(list)
  }
  return { map: { version: 3, file: `bundle${seed}.js`, sources, names, mappings }, lines }
}

// Four large maps. Adapters load them once at module load, the way a stack-trace
// or coverage tool loads a map once and then answers many lookups.
const specs = [[400, 10, 8, 20], [900, 12, 14, 60], [1500, 14, 20, 80], [2500, 12, 24, 120]]
const built = specs.map(([lines, density, sources, names], i) => build(5000 + i * 7919, lines, density, sources, names))
export const maps = built.map((b) => b.map)

// A query is [line (1-based), column (0-based)]. Mix of hits, columns past the last
// segment of a line, columns before the first, empty lines, and lines past the end.
const expectedFor = (m, line, col) => {
  const segs = built[m].lines[line - 1]
  if (!segs) return [null, null, null, null]
  let best = null
  for (const s of segs) if (s[0] <= col) best = s
  return best ? [best[1], best[2], best[3], best[4]] : [null, null, null, null]
}
export const cases = Array.from({ length: 40 }, (_, i) => {
  const m = i % maps.length
  const r = rng(77 + i * 104729)
  const lineCount = built[m].lines.length
  const n = 40 + (i % 5) * 40
  const queries = Array.from({ length: n }, () => {
    const k = r(20)
    const line = k === 0 ? lineCount + 1 + r(5) : 1 + r(lineCount)
    const col = k === 1 ? 0 : r(260)
    return [line, col]
  })
  return { input: { map: m, queries }, expected: queries.map(([l, c]) => expectedFor(m, l, c)) }
})

// Each result is a list with one entry per query, shaped { source, line (1-based),
// column (0-based), name }, with nulls when nothing maps. Projection to tuples is
// done here, outside timing, so a library's own result objects are accepted.
const project = (o) => [o.source, o.line, o.column, o.name]
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out), `fixture ${i}: a list is required`)
    assert.equal(out.length, expected.length, `fixture ${i}: result count`)
    assert.deepStrictEqual(out.map(project), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
