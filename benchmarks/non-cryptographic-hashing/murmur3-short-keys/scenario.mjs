import { strict as assert } from 'node:assert'
// Independent reference: MurmurHash3 x86 32-bit, seed 0, over ASCII bytes.
const imul = Math.imul
const reference = (s) => {
  const n = s.length, blocks = n & ~3
  let h = 0, i = 0
  for (; i < blocks; i += 4) {
    let k = s.charCodeAt(i) | (s.charCodeAt(i + 1) << 8) | (s.charCodeAt(i + 2) << 16) | (s.charCodeAt(i + 3) << 24)
    k = imul(k, 0xcc9e2d51); k = (k << 15) | (k >>> 17); k = imul(k, 0x1b873593)
    h ^= k; h = (h << 13) | (h >>> 19); h = (imul(h, 5) + 0xe6546b64) | 0
  }
  let k = 0
  switch (n & 3) {
    case 3: k ^= s.charCodeAt(i + 2) << 16
    case 2: k ^= s.charCodeAt(i + 1) << 8
    case 1: k ^= s.charCodeAt(i); k = imul(k, 0xcc9e2d51); k = (k << 15) | (k >>> 17); k = imul(k, 0x1b873593); h ^= k
  }
  h ^= n
  h ^= h >>> 16; h = imul(h, 0x85ebca6b); h ^= h >>> 13; h = imul(h, 0xc2b2ae35); h ^= h >>> 16
  return h >>> 0
}
// Known vectors guard the reference itself.
assert.equal(reference(''), 0)
assert.equal(reference('hello'), 0x248bfa47)
assert.equal(reference('The quick brown fox jumps over the lazy dog'), 0x2e4ff723)
const words = ['user', 'session', 'cache', 'item', 'order', 'key', 'node', 'tenant', 'index', 'value']
const keys = Array.from({ length: 76 }, (_, i) => {
  switch (i % 4) {
    case 0: return `${words[i % 10]}:${i * 7919}`
    case 1: return `/api/v${1 + i % 3}/${words[(i * 3) % 10]}/${i * 104729}/details?page=${i}`
    case 2: return `${words[i % 10]}_${words[(i + 3) % 10]}_${'x'.repeat(i % 17)}${i}`
    default: return `0x${(i * 2654435761 >>> 0).toString(16)}-${i}-${'ab'.repeat(i % 11)}`
  }
})
keys.push('', 'a', 'ab', 'abc')
export const cases = keys.map((input) => ({ input, expected: reference(input) }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'number', `fixture ${i}: number output required`)
    assert.equal(outputs[i] >>> 0, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value & 0xffff
