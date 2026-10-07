import { strict as assert } from 'node:assert'
// Independent precedence oracle (semver 2.0.0 section 11), build metadata ignored.
const split = (v) => {
  const [core, ...rest] = v.split('+')[0].split('-')
  return { nums: core.split('.').map(Number), pre: rest.length ? rest.join('-').split('.') : null }
}
const cmpId = (a, b) => {
  const an = /^\d+$/.test(a), bn = /^\d+$/.test(b)
  if (an && bn) return Number(a) - Number(b)
  if (an) return -1
  if (bn) return 1
  return a < b ? -1 : a > b ? 1 : 0
}
const oracle = (x, y) => {
  const a = split(x), b = split(y)
  for (let i = 0; i < 3; i++) if (a.nums[i] !== b.nums[i]) return a.nums[i] - b.nums[i]
  if (!a.pre && !b.pre) return 0
  if (!a.pre) return 1
  if (!b.pre) return -1
  for (let i = 0; i < Math.min(a.pre.length, b.pre.length); i++) { const c = cmpId(a.pre[i], b.pre[i]); if (c) return c }
  return a.pre.length - b.pre.length
}
const pres = [null, null, null, 'alpha', 'alpha.1', 'alpha.beta', 'beta', 'beta.2', 'beta.11', 'rc.1', 'rc.2', 'next.3', 'canary.20260101', 'x.7.z.92', '0.3.7']
const builds = [null, null, null, null, 'build.5', 'exp.sha.5114f85', '20260315']
const key = (v) => v.split('+')[0]
let seed = 12345
const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return Math.floor(seed / 65536) % n }
const makeList = (size, maxMajor, maxMinor, maxPatch) => {
  const seen = new Set(), out = []
  while (out.length < size) {
    let v = `${rnd(maxMajor)}.${rnd(maxMinor)}.${rnd(maxPatch)}`
    const p = pres[rnd(pres.length)], b = builds[rnd(builds.length)]
    if (p) v += '-' + p
    if (seen.has(key(v))) continue
    seen.add(key(v))
    out.push(b ? `${v}+${b}` : v)
  }
  return out
}
export const cases = Array.from({ length: 48 }, (_, i) => {
  const size = 12 + (i * 17) % 79
  const input = makeList(size, 2 + (i % 12), 3 + (i * 5) % 25, 4 + (i * 7) % 30)
  for (let k = input.length - 1; k > 0; k--) { const j = rnd(k + 1); [input[k], input[j]] = [input[j], input[k]] }
  return { input, expected: [...input].sort(oracle) }
})
cases[0] = { input: ['1.10.0', '1.9.0', '1.2.0', '1.0.0-rc.1', '1.0.0', '1.0.0-beta.11', '1.0.0-beta.2', '1.0.0-beta', '1.0.0-alpha.beta', '1.0.0-alpha.1', '1.0.0-alpha', '0.0.9'] }
cases[0].expected = [...cases[0].input].sort(oracle)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    assert.ok(Array.isArray(outputs[i]), `fixture ${i}: array required`)
    assert.deepEqual([...outputs[i]], expected, `fixture ${i}`)
    assert.notDeepEqual(expected, input, `fixture ${i}: input already sorted`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
