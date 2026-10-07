import { strict as assert } from 'node:assert'
const words = ['alpha', 'beta', 'gamma', 'São Paulo', '日本語', 'naïve 😀', '']
// Property names come from a fixed pool so sources overlap heavily.
const pool = Array.from({ length: 48 }, (_, k) => (k % 12 === 11 ? `ключ-${k}` : k % 12 === 7 ? `café_${k}` : `opt${k}`))
// A nested value carries a key only its own source has, so a deep merge of two
// sources gives a different object from replacing one with the other.
const nested = (i, k, s) => ({ host: `h${s}-${k}`, port: 3000 + i + s, tls: { on: (k + s) % 2 === 0 }, [`only${s}`]: s })
const value = (i, k, s) => {
  // Every sixth property is nested in every source that has it, so nested
  // values do meet under the same key.
  if (k % 6 === 5) return nested(i, k, s)
  switch ((i + k + s) % 8) {
    case 0: return `v${i}-${k}-${s}`
    case 1: return (i * 7 + k * 3 + s) % 1000
    case 2: return (i + k + s) % 3 === 0
    case 3: return null
    case 4: return 0
    case 5: return ''
    case 6: return words[(i + k + s) % words.length]
    default: return nested(i, k, s)
  }
}
const source = (i, s) => {
  const o = {}
  const count = 12 + ((i * 5 + s * 11) % 29)
  const start = (i * 3 + s * 7) % pool.length
  for (let j = 0; j < count; j++) {
    const k = (start + j * (1 + (s % 3))) % pool.length
    o[pool[k]] = value(i, k, s)
  }
  return o
}
const build = (i) => Array.from({ length: 3 + (i % 3) }, (_, s) => source(i, s))
const reference = (sources) => {
  const out = {}
  for (const s of sources) for (const key of Object.keys(s)) out[key] = s[key]
  return out
}
export const cases = Array.from({ length: 40 }, (_, i) => ({ input: build(i), expected: reference(build(i)) }))
// A deep merge must give a different answer for every case, or the check
// below could not tell it from a shallow one.
const isObject = (v) => v !== null && typeof v === 'object'
const deep = (sources) => {
  const out = {}
  for (const s of sources) for (const key of Object.keys(s)) out[key] = isObject(out[key]) && isObject(s[key]) ? deep([out[key], s[key]]) : s[key]
  return out
}
for (const [i, { input, expected }] of cases.entries()) assert.notDeepStrictEqual(deep(input), expected, `fixture ${i}: a deep merge must differ`)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(out !== null && typeof out === 'object' && !Array.isArray(out), `fixture ${i}: object required`)
    assert.equal(Object.getPrototypeOf(out), Object.prototype, `fixture ${i}: plain object required`)
    assert.deepStrictEqual(out, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => {
  const outputs = cases.map(({ input }) => operation(input))
  verifyResults(outputs)
  cases.forEach(({ input }, i) => assert.deepStrictEqual(input, build(i), `fixture ${i}: sources must not be modified`))
}
// Reading a property allocates nothing; opt0 is not always present, so use a
// property that every case has once merged.
export const consume = (value) => (value.opt1 === undefined ? 1 : 2)
