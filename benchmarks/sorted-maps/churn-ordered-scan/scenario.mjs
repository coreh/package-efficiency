import { strict as assert } from 'node:assert'
// Input: { keys, removals }. keys are distinct ASCII strings inserted in the given order, key i
// getting value i. removals are deleted in order (some absent or repeated). A correct result is
// [removed, ordered]: removed[j] is true when deleting removals[j] removed a key, ordered is the
// values of the remaining keys in ascending bytewise key order.
const areas = ['user', 'users', 'order', 'orders', 'item', 'cache', 'config', 'session', 'log', 'tmp', 'Billing', 'api-v2']
const parts = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'Iota', 'kappa', 'lambda', 'mu', 'x_1', 'a-b', 'a.b']
let seed = 987654321
const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0)
const build = (i) => {
  const n = 600 + (i * 49) % 1700
  const set = new Set()
  while (set.size < n) {
    const a = areas[Math.floor(next() * areas.length)], p = parts[Math.floor(next() * parts.length)]
    set.add(`${a}/${Math.floor(next() * 100000)}/${p}${next() < 0.4 ? '/' + Math.floor(next() * 500) : ''}`)
  }
  const keys = [...set]
  shuffle(keys)
  const removals = shuffle(keys.slice(0, Math.floor(n * 0.4)).concat(keys.slice(n - 7 - (i % 5))))
  const removals2 = removals.slice(0, Math.floor(n * 0.4))
  for (let j = 0; j < 12; j++) removals2.splice(Math.floor(next() * removals2.length), 0, j % 2 ? `${areas[j % areas.length]}/${100000 + j}/missing` : removals2[Math.floor(next() * removals2.length)])
  const alive = new Map(keys.map((k, v) => [k, v]))
  const removed = removals2.map((k) => alive.delete(k))
  const ordered = [...alive].sort((x, y) => cmp(x[0], y[0])).map(([, v]) => v)
  return { input: { keys, removals: removals2 }, expected: [removed, ordered] }
}
export const cases = Array.from({ length: 36 }, (_, i) => build(i))
cases[35] = { input: { keys: ['b', 'ab', 'a', 'abc', 'B', 'a/', 'ab/c'], removals: ['ab', 'zz', 'a', 'ab', 'B'] }, expected: [[true, false, true, false, true], [5, 6, 3, 0]] }
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepEqual(JSON.parse(JSON.stringify(outputs[i])), expected, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result[0].length + result[1].length
