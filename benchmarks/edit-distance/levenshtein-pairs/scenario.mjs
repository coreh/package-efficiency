import { strict as assert } from 'node:assert'
// Independent two-row dynamic-programming oracle.
const reference = (a, b) => {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}
// Deterministic generator (linear congruential), so fixtures never change.
let seed = 20261006
const next = (n) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor((seed / 4294967296) * n) }
const alphabet = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,-_'
const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'package', 'version', 'config', 'server', 'request', 'handler', 'string', 'distance', 'similar', 'result']
const randomChars = (n) => Array.from({ length: n }, () => alphabet[next(alphabet.length)]).join('')
const sentence = (n) => { let s = ''; while (s.length < n) s += (s ? ' ' : '') + words[next(words.length)]; return s.slice(0, n) }
const mutate = (s, edits) => {
  const chars = [...s]
  for (let k = 0; k < edits; k++) {
    const pos = next(chars.length + 1), op = next(3), c = alphabet[next(alphabet.length)]
    if (op === 0) chars.splice(pos, 0, c)
    else if (op === 1 && chars.length > 5) chars.splice(Math.min(pos, chars.length - 1), 1)
    else chars[Math.min(pos, chars.length - 1)] = c
  }
  return chars.join('')
}
const pairs = []
for (let i = 0; i < 48; i++) {
  const len = [5, 8, 12, 20, 35, 60, 90, 130, 170, 200][i % 10]
  const base = i % 2 ? sentence(len) : randomChars(len)
  let other
  switch (i % 6) {
    case 0: other = mutate(base, 1 + next(3)); break
    case 1: other = mutate(base, Math.max(2, Math.floor(len / 8))); break
    case 2: other = i % 12 === 2 ? base : mutate(base, Math.max(3, Math.floor(len / 3))); break
    case 3: other = i % 2 ? randomChars(5 + next(196)) : sentence(5 + next(196)); break
    case 4: other = base.slice(0, Math.max(5, Math.floor(base.length / 2))) + randomChars(next(40)); break
    default: other = 'ab'.repeat(Math.ceil(len / 2)).slice(0, len); break
  }
  pairs.push([base, other.slice(0, 200)])
}
pairs[10] = ['kitten', 'sitting']
pairs[11] = ['a'.repeat(200), 'b'.repeat(200)]
pairs[22] = ['abcde', 'abcde']
pairs[23] = ['saturday', 'sunday']
export const cases = pairs.map((input) => ({ input, expected: reference(input[0], input[1]) }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'number', `fixture ${i}: number required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value
