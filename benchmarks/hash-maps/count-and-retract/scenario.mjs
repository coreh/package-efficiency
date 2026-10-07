import { strict as assert } from 'node:assert'

// Deterministic generator (LCG), so fixtures never change between runs.
let seed = 20261007
const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0)
const range = (n) => next() % n
const hex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[range(16)]).join('')
const words = ['the', 'of', 'and', 'to', 'in', 'is', 'you', 'that', 'it', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said', 'there', 'use']

const vocabInts = (v, style) => Array.from({ length: v }, (_, i) =>
  style === 0 ? 1000 + i : style === 1 ? range(2_000_000_000) - 1_000_000_000 : style === 2 ? i * 4096 + 7 : range(2_000_000) + 3_000_000_000)
const vocabStrings = (v, style) => Array.from({ length: v }, (_, i) =>
  style === 0 ? `${words[i % words.length]}${i >= words.length ? i : ''}`
    : style === 1 ? `/api/v${1 + range(3)}/${['items', 'orders', 'users', 'search'][range(4)]}/${i}`
      : style === 2 ? hex(16 + range(17)) : `user:${100000 + range(900000)}`)
// Skewed pick: low indexes are hot.
const pick = (vocab) => { const r = range(1 << 20) / (1 << 20); return vocab[Math.floor(vocab.length * r * r * r)] }
const stream = (vocab, n) => Array.from({ length: n }, () => pick(vocab))
const retracts = (vocab, events, absent, n) => Array.from({ length: n }, (_, i) =>
  i % 5 === 0 ? absent() : i % 5 === 1 ? vocab[vocab.length - 1 - range(Math.min(vocab.length, 10))] : events[range(events.length)])

const sizes = [24, 30, 40, 56, 72, 90, 110, 130, 160, 200, 240, 300, 400]
export const cases = Array.from({ length: 40 }, (_, i) => {
  const n = sizes[(i * 3) % sizes.length]
  const m = sizes[(i * 5 + 2) % sizes.length]
  const iv = vocabInts(8 + (i * 7) % 90, i % 4)
  const sv = vocabStrings(8 + (i * 11) % 90, (i >> 1) % 4)
  const ints = stream(iv, n)
  const strings = stream(sv, m)
  const intRetracts = retracts(iv, ints, () => range(4_000_000_000) - 2_000_000_000, Math.ceil(n * 0.6))
  const stringRetracts = retracts(sv, strings, () => `missing/${hex(6)}`, Math.ceil(m * 0.6))
  return { input: { ints, strings, intRetracts, stringRetracts } }
})

// Reference: the same steps with a built-in Map.
const side = (events, drops, weight) => {
  const map = new Map()
  for (const k of events) map.set(k, (map.get(k) ?? 0) + 1)
  let max = 0, sq = 0, ws = 0
  for (const [k, c] of map) { if (c > max) max = c; sq += c * c; ws += weight(k) * c }
  const distinct = map.size
  for (const k of drops) {
    const c = map.get(k)
    if (c === undefined) continue
    if (c === 1) map.delete(k); else map.set(k, c - 1)
  }
  let total = 0
  for (const c of map.values()) total += c
  return [distinct, max, sq, ws, map.size, total]
}
for (const c of cases) {
  const { ints, strings, intRetracts, stringRetracts } = c.input
  c.expected = [...side(ints, intRetracts, (k) => k), ...side(strings, stringRetracts, (k) => k.length)]
}

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out), `fixture ${i}: a list of integers is required`)
    assert.equal(out.length, 12, `fixture ${i}: 12 numbers required`)
    assert.ok(out.every(Number.isInteger), `fixture ${i}: integers required`)
    assert.deepStrictEqual(out, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result[0]
