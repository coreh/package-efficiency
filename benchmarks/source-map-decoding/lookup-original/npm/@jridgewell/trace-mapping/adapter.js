import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
// The same four maps as scenario.mjs, rebuilt here (adapters cannot import the scenario).
const rng = (seed) => { let s = seed >>> 0; return (n) => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s >>> 8) % n } }
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const vlq = (n) => { let v = n < 0 ? ((-n) << 1) | 1 : n << 1, out = ''; do { let d = v & 31; v >>>= 5; if (v > 0) d |= 32; out += B64[d] } while (v > 0); return out }
const identifiers = ['render', 'props', 'state', 'useEffect', 'handler', 'config', 'value', 'index', 'result', 'options', 'callback', 'node', 'ctx', 'items', 'total']
const dirs = ['src', 'src/components', 'src/lib', 'src/utils', 'node_modules/lodash', 'node_modules/react/cjs']
const build = (seed, lineCount, density, sourceCount, nameCount) => {
  const r = rng(seed)
  const sources = Array.from({ length: sourceCount }, (_, i) => `${dirs[(i + seed) % dirs.length]}/module${i}.${i % 3 === 0 ? 'ts' : 'js'}`)
  const names = Array.from({ length: nameCount }, (_, i) => `${identifiers[(i + seed) % identifiers.length]}${i}`)
  let mappings = ''
  let src = 0, oLine = 0, oCol = 0, name = 0
  for (let line = 0; line < lineCount; line++) {
    if (line > 0) mappings += ';'
    const segs = r(10) === 0 ? 0 : 1 + r(density)
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
      prevGen = genCol; src = nsrc; oLine = nLine; oCol = nCol; if (hasName) name = nName
      first = false
    }
  }
  return { version: 3, file: `bundle${seed}.js`, sources, names, mappings }
}
const specs = [[400, 10, 8, 20], [900, 12, 14, 60], [1500, 14, 20, 80], [2500, 12, 24, 120]]
const maps = specs.map(([lines, density, sources, names], i) => build(5000 + i * 7919, lines, density, sources, names))
// Consumers are created once at module load; only the lookups are measured.
const consumers = maps.map((m) => new TraceMap(m))
export const operation = ({ map, queries }) => {
  const c = consumers[map]
  const out = new Array(queries.length)
  for (let i = 0; i < queries.length; i++) out[i] = originalPositionFor(c, { line: queries[i][0], column: queries[i][1] })
  return out
}
