import { strict as assert } from 'node:assert'
// The harness creates `files.tree` in the task's scratch directory before
// each adapter process starts, and names that directory in BENCH_FILES.
const scratch = process.env.BENCH_FILES ?? '/BENCH_FILES-is-not-set'
const CYCLES = 20
// Three empty lock files that already exist. Nothing is written to them.
const paths = ['locks/plain.lock', 'locks/with space/ünï côde.lock', 'locks/a/b/c/d/deep.lock']
export const files = { tree: paths.map((path) => ({ path, content: '' })), reset: [] }
// `cycles` is the number of lock, probe, unlock, probe rounds in one call.
export const cases = paths.map((path) => ({ input: { path: `${scratch}/${path}`, cycles: CYCLES }, expected: [0, CYCLES] }))

// A result is [times the second handle got the lock while the first held it,
// times it got it after the first released]. Exactly [0, cycles].
function check({ input, expected }, result, i) {
  assert.ok(Array.isArray(result) && result.length === 2, `fixture ${i}: a list of two counts is required`)
  for (const n of result) assert.ok(typeof n === 'number' && Number.isInteger(n), `fixture ${i}: counts must be integers`)
  assert.equal(result[0], expected[0], `fixture ${i}: the second handle got the lock ${result[0]} times while it was held`)
  assert.equal(result[1], expected[1], `fixture ${i}: the second handle got the lock ${result[1]} times after release, expected ${expected[1]}`)
}
export const verifyResults = (outputs) => {
  assert.equal(outputs?.length, cases.length, 'one output per fixture is required')
  cases.forEach((c, i) => check(c, outputs[i], i))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length
