import { strict as assert } from 'node:assert'

const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k])])) : value
// Oracle: native JSON.stringify applies toJSON and drops undefined; then sort recursively and stringify again.
const oracle = (input) => JSON.stringify(canonical(JSON.parse(JSON.stringify(input))))

class Money {
  constructor(cents, cur) { this.cents = cents; this.cur = cur }
  toJSON() { return { currency: this.cur, amount: this.cents / 100, cents: this.cents } }
}

// Deterministic pseudo-shuffle (no randomness): a linear congruential order.
const shuffled = (arr, seed) => {
  const out = arr.slice()
  let s = seed * 2654435761 % 4294967296
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango']

const entry = (i, k) => {
  switch ((i + k) % 8) {
    case 0: return `value ${k} of "${words[k % 20]}"`
    case 1: return k * 1.25 + i
    case 2: return new Date(Date.UTC(2020 + (k % 6), k % 12, 1 + (k % 28), k % 24, (k * 7) % 60, 0))
    case 3: return undefined
    case 4: return new Money(k * 137 + i, k % 2 ? 'EUR' : 'BRL')
    case 5: return { z: new Date(Date.UTC(2024, k % 12, 1)), a: undefined, m: [k, undefined, null, new Money(k, 'USD')], b: k % 3 === 0 }
    case 6: return [k, undefined, `café ${k}`, new Date(Date.UTC(2021, 0, 1 + (k % 28)))]
    default: return k % 2 === 0
  }
}

const sizes = [20, 40, 60, 80, 100, 120, 150, 200, 250, 300]
export const cases = Array.from({ length: 40 }, (_, i) => {
  const n = sizes[i % sizes.length]
  const keys = Array.from({ length: n }, (_, k) => `${words[(k * 7 + i) % 20]}_${(k * 31 + i * 17) % 997}_${k}`)
  const input = {}
  shuffled(keys, i + 1).forEach((key) => { input[key] = entry(i, +key.split('_')[2]) })
  input.generatedAt = new Date(Date.UTC(2025, i % 12, 1 + (i % 28)))
  input.pending = undefined
  input.owner = new Money(i * 100, 'BRL')
  return { input, expected: oracle(input) }
})
cases.push({ input: { b: undefined, a: new Date(0) }, expected: '{"a":"1970-01-01T00:00:00.000Z"}' })

export const verifyResults = (outputs) => {
  assert.equal(outputs.length, cases.length)
  cases.forEach(({ expected }, i) => assert.equal(outputs[i], expected))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
