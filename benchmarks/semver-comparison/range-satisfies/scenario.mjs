import { strict as assert } from 'node:assert'
const cmp = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; return 0 }
const nums = (v) => v.split(/[-+]/)[0].split('.').map(Number)
// Independent oracle. Prerelease versions never satisfy these ranges (no comparator carries a prerelease).
const oracle = (version, range) => {
  const v = nums(version), pre = version.includes('-')
  const [, op, rest] = /^(\^|~|>=|<=|>|<|=)(.*)$/.exec(range)
  const r = nums(rest)
  if (pre) return false
  const c = cmp(v, r)
  switch (op) {
    case '=': return c === 0
    case '>': return c > 0
    case '>=': return c >= 0
    case '<': return c < 0
    case '<=': return c <= 0
    case '~': return c >= 0 && cmp(v, [r[0], r[1] + 1, 0]) < 0
    case '^': return c >= 0 && cmp(v, r[0] > 0 ? [r[0] + 1, 0, 0] : r[1] > 0 ? [0, r[1] + 1, 0] : [0, 0, r[2] + 1]) < 0
  }
}
const ops = ['^', '~', '>=', '>', '<', '<=', '=']
const tags = ['', '', '', '-beta.2', '', '+build.5', '-rc.1+exp.sha.5114f85', '']
export const cases = Array.from({ length: 72 }, (_, i) => {
  const a = (i * 7 + 3) % 4, b = (i * 5 + 1) % 6, c = (i * 11 + 2) % 9
  const range = `${ops[i % 7]}${(i % 3 === 0 ? 0 : a)}.${(i % 3 === 1 ? 0 : b)}.${(i % 4 === 0 ? 0 : c)}`
  const version = `${i % 5 === 0 ? a : (a + (i % 2)) % 4}.${(b + i % 3) % 6}.${(c + (i >> 1) % 4) % 9}${tags[i % 8]}`
  return { input: [version, range], expected: oracle(version, range) }
})
// Hand-picked edges.
for (const [v, r] of [['1.2.3', '^1.2.3'], ['2.0.0', '^1.2.3'], ['0.2.5', '^0.2.3'], ['0.3.0', '^0.2.3'], ['0.0.3', '^0.0.3'], ['0.0.4', '^0.0.3'], ['1.2.9', '~1.2.3'], ['1.3.0', '~1.2.3'], ['1.0.0-beta.1', '>=0.9.0'], ['1.0.0+meta', '=1.0.0'], ['10.0.0', '>9.9.9'], ['1.10.0', '<1.9.0']]) cases.push({ input: [v, r], expected: oracle(v, r) })
assert.ok(cases.some((c) => c.expected) && cases.some((c) => !c.expected))
export const verify = (operation) => { for (const { input, expected } of cases) assert.equal(operation(input), expected, String(input)) }
export const consume = (value) => Number(value)
