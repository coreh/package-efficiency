import { strict as assert } from 'node:assert'
// Independent reference: drop the common prefix, climb out of the rest of `from`.
const reference = ([from, to]) => {
  const a = from.split('/').filter(Boolean)
  const b = to.split('/').filter(Boolean)
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return [...Array(a.length - i).fill('..'), ...b.slice(i)].join('/')
}
const canonical = (s) => (s === '.' ? '' : s)
const names = ['src', 'lib', 'node_modules', 'my project', 'café', '日本語', '.hidden', 'a.b', '...', 'index.test.js', 'Δ', 'v1.2.3', 'x', 'packages', 'dist', 'home', 'user', 'projects', 'app']
const seg = (i, j) => names[(i * 3 + j * 5 + (j * j)) % names.length]
const generated = Array.from({ length: 52 }, (_, i) => {
  const shared = (i * 5) % 6
  const common = Array.from({ length: shared }, (_, j) => seg(i, j))
  const fromTail = Array.from({ length: (i * 7) % 5 }, (_, j) => seg(i + 1, j + 7))
  const toTail = Array.from({ length: 1 + ((i * 3) % 6) }, (_, j) => seg(i + 2, j + 3))
  return ['/' + [...common, ...fromTail].join('/'), '/' + [...common, ...toTail].join('/')]
})
const fixed = [
  ['/a/b/c', '/a/b/c'], ['/a/b/c', '/a/b'], ['/a/b', '/a/b/c/d'], ['/', '/a/b'], ['/a/b', '/'],
  ['/usr/local/bin', '/usr/lib/node'], ['/x/y/z', '/q/r/s'], ['/home/user/projects/app/src', '/home/user/projects/app/dist/index.js'],
]
export const cases = [...generated, ...fixed].map((input) => ({ input, expected: canonical(reference(input)) }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(canonical(outputs[i]), expected, `fixture ${i}: ${JSON.stringify(cases[i].input)}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
