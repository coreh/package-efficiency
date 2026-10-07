import { strict as assert } from 'node:assert'
// An input is { file, sources, names, mappings }: mappings is a list of
// [generatedLine, generatedColumn, sourceIndex, originalLine, originalColumn, nameIndex]
// in generated order; lines and columns are zero-based, nameIndex is -1 for none.
const idents = ['render', 'state', 'props', 'index', 'value', 'callback', 'options', 'result', 'element', 'children', 'handler', 'buffer', 'length', 'update', 'create', 'config']
const build = (seed, sourceCount, lines) => {
  let s = seed * 2654435761 >>> 0
  const next = (n) => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) % n
  const sources = Array.from({ length: sourceCount }, (_, i) => `src/${['components', 'lib', 'utils', 'pages'][i % 4]}/module-${seed}-${i}.ts`)
  const names = Array.from({ length: 8 + sourceCount * 3 }, (_, i) => `${idents[i % idents.length]}${i >= idents.length ? i : ''}`)
  const mappings = []
  // A bundle: each source contributes a run of generated lines, in order.
  let source = 0, originalLine = 0
  for (let line = 0; line < lines; line++) {
    if (next(40) === 0) { source = (source + 1) % sourceCount; originalLine = next(5) }
    if (next(12) === 0) continue // a generated line with no mapping
    let column = next(4) * 2, originalColumn = next(8)
    for (let k = 1 + next(9); k > 0; k--) {
      mappings.push([line, column, source, originalLine, originalColumn, next(3) === 0 ? next(names.length) : -1])
      column += 1 + next(14)
      originalColumn += 1 + next(11)
    }
    originalLine += 1 + next(2)
  }
  return { input: { file: `bundle-${seed}.js`, sources, names, mappings } }
}
const shapes = [[3, 60], [8, 200], [20, 500], [40, 1200], [60, 2000], [100, 3500], [5, 120], [12, 350], [30, 800], [50, 1600], [80, 2800], [16, 420]]
export const cases = shapes.map(([sourceCount, lines], i) => build(i + 1, sourceCount, lines))

// Base64 VLQ, decoded here only to check outputs.
const digits = new Map(Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', (c, i) => [c, i]))
export const decodeMappings = (map) => {
  const out = []
  let source = 0, originalLine = 0, originalColumn = 0, name = 0
  for (const [line, text] of map.mappings.split(';').entries()) {
    let column = 0
    for (const segment of text ? text.split(',') : []) {
      const fields = []
      let value = 0, shift = 0
      for (const ch of segment) {
        const digit = digits.get(ch)
        assert.ok(digit !== undefined, `not a base64 VLQ digit: ${ch}`)
        value += (digit & 31) << shift
        if (digit & 32) shift += 5
        else { fields.push(value & 1 ? -(value >>> 1) : value >>> 1); value = shift = 0 }
      }
      assert.ok(fields.length === 4 || fields.length === 5, `a segment of ${fields.length} fields`)
      column += fields[0]; source += fields[1]; originalLine += fields[2]; originalColumn += fields[3]
      if (fields.length === 5) name += fields[4]
      out.push([line, column, map.sources[source], originalLine, originalColumn, fields.length === 5 ? map.names[name] : null])
    }
  }
  return out
}
export const verifyOne = (i, output) => {
  const { sources, names, mappings } = cases[i].input
  const map = typeof output === 'string' ? JSON.parse(output) : output
  assert.ok(map && typeof map === 'object', `fixture ${i}: a source map object or its JSON text is required`)
  assert.equal(Number(map.version), 3, `fixture ${i}: version`)
  assert.equal(typeof map.mappings, 'string', `fixture ${i}: the mappings must be encoded as a string`)
  assert.ok(Array.isArray(map.sources) && Array.isArray(map.names), `fixture ${i}: sources and names lists`)
  const got = decodeMappings(map)
  assert.equal(got.length, mappings.length, `fixture ${i}: number of mappings`)
  for (const [k, m] of mappings.entries()) assert.deepEqual(got[k], [m[0], m[1], sources[m[2]], m[3], m[4], m[5] < 0 ? null : names[m[5]]], `fixture ${i}: mapping ${k}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => typeof value === 'string' ? value.length : value.mappings.length
