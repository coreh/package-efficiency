import { strict as assert } from 'node:assert'
// Input: { keys, lookups, prefixes }. keys are distinct ASCII strings, inserted in the given
// (shuffled) order, key i getting the value i. A correct result is [found, scans]:
//   found[j]  = value of lookups[j], or null when that key is absent
//   scans[j]  = values of every key starting with prefixes[j], in ascending key order
// Keys compare bytewise (code unit order; identical for ASCII).
const areas = ['user', 'users', 'order', 'orders', 'item', 'cache', 'config', 'session', 'log', 'tmp']
const parts = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'Iota', 'kappa', 'lambda', 'mu', 'x_1', 'a-b']
let seed = 12345
const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296
const build = (i) => {
  const n = 120 + (i * 37) % 380
  const set = new Set()
  while (set.size < n) {
    const a = areas[Math.floor(next() * areas.length)], p = parts[Math.floor(next() * parts.length)]
    set.add(`${a}/${Math.floor(next() * 1000)}/${p}${next() < 0.3 ? '/' + Math.floor(next() * 50) : ''}`)
  }
  const keys = [...set]
  const lookups = Array.from({ length: 40 }, (_, j) => j % 3 === 2 ? `${areas[j % areas.length]}/${1000 + j}/missing` : keys[Math.floor(next() * n)])
  const prefixes = ['', ...Array.from({ length: 7 }, () => keys[Math.floor(next() * n)].slice(0, 2 + Math.floor(next() * 12))), 'user', 'zzz', 'order/1', 'users/']
  const sorted = keys.map((k, v) => [k, v]).sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0))
  const index = new Map(keys.map((k, v) => [k, v]))
  const expected = [lookups.map((k) => index.has(k) ? index.get(k) : null), prefixes.map((p) => sorted.filter(([k]) => k.startsWith(p)).map(([, v]) => v))]
  return { input: { keys, lookups, prefixes }, expected }
}
export const cases = Array.from({ length: 40 }, (_, i) => build(i))
cases[39] = { input: { keys: ['b', 'ab', 'a', 'abc', 'B'], lookups: ['a', 'abc', 'ac', 'B'], prefixes: ['a', 'ab', 'b', ''] }, expected: [[2, 3, null, 4], [[2, 1, 3], [1, 3], [0], [4, 2, 1, 3, 0]]] }
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepEqual(JSON.parse(JSON.stringify(outputs[i])), expected, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result[0].length + result[1].length
