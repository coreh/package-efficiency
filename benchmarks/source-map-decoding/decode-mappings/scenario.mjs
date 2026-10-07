import { strict as assert } from 'node:assert'

// Deterministic generator (no Math.random): a small linear congruential PRNG.
const rng = (seed) => { let s = seed >>> 0; return (n) => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s >>> 8) % n } }

// Independent base64 VLQ encoder used only to build fixtures.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const vlq = (n) => {
  let v = n < 0 ? ((-n) << 1) | 1 : n << 1, out = ''
  do { let d = v & 31; v >>>= 5; if (v > 0) d |= 32; out += B64[d] } while (v > 0)
  return out
}

const identifiers = ['render', 'props', 'state', 'useEffect', 'handler', 'config', 'value', 'index', 'result', 'options', 'callback', 'node', 'ctx', 'items', 'total']
const dirs = ['src', 'src/components', 'src/lib', 'src/utils', 'node_modules/lodash', 'node_modules/react/cjs']

// Builds one source map: absolute segments plus the encoded "mappings" string.
const build = (seed, lineCount, density, sourceCount, nameCount) => {
  const r = rng(seed)
  const sources = Array.from({ length: sourceCount }, (_, i) => `${dirs[(i + seed) % dirs.length]}/module${i}.${i % 3 === 0 ? 'ts' : 'js'}`)
  const names = Array.from({ length: nameCount }, (_, i) => `${identifiers[(i + seed) % identifiers.length]}${i}`)
  const expected = []
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
      expected.push([line + 1, genCol, sources[nsrc], nLine + 1, nCol, hasName ? names[nName] : null])
      prevGen = genCol; src = nsrc; oLine = nLine; oCol = nCol; if (hasName) name = nName
      first = false
    }
  }
  return { map: { version: 3, file: `bundle${seed}.js`, sources, names, mappings }, expected }
}

const sizes = [[3, 2, 1, 0], [12, 3, 2, 3], [40, 6, 3, 8], [80, 8, 5, 12], [150, 10, 8, 20], [300, 12, 12, 40], [600, 14, 20, 80]]
export const cases = Array.from({ length: 42 }, (_, i) => {
  const [lines, density, sources, names] = sizes[i % sizes.length]
  const { map, expected } = build(1000 + i * 7919, lines + (i % 5) * 3, density, sources, names)
  return { input: map, expected }
})

// Each result is a list of mappings, one per segment in generated order, shaped
// { generatedLine (1-based), generatedColumn (0-based), source, originalLine
// (1-based), originalColumn (0-based), name }. The projection to plain tuples
// happens here, outside timing, so a library's own mapping objects are accepted.
const project = (m) => [m.generatedLine, m.generatedColumn, m.source, m.originalLine, m.originalColumn, m.name]
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out), `fixture ${i}: a list of mappings is required`)
    assert.equal(out.length, expected.length, `fixture ${i}: mapping count`)
    assert.deepStrictEqual(out.map(project), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
