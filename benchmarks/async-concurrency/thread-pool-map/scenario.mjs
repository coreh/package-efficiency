import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (a 32-bit LCG); no Math.random.
const rng = (seed) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296 }
// Four threads, always: the thread count is part of the task (task.json
// load.threads).
const THREADS = 4
const JOBS = 256
// The job, written out the same way in every adapter: `rounds` steps of
// xorshift32 from `seed`, all arithmetic modulo 2^32. A seed is never 0
// (xorshift32 would stay at 0).
export const job = (seed, rounds) => {
  let x = seed >>> 0
  for (let r = 0; r < rounds; r++) {
    x = (x ^ (x << 13)) >>> 0
    x = (x ^ (x >>> 17)) >>> 0
    x = (x ^ (x << 5)) >>> 0
  }
  return x
}
// Three shapes of the same total work (512,000 steps in each fixture): every
// job alike; jobs of varied length, 500 to 3,500 steps, in pairs that add up
// to 4,000; and a few long jobs among short ones.
const SHAPES = [
  ['even', () => () => 2000],
  ['varied', (next) => { let d = 0; return (i) => (i % 2 === 0 ? 2000 + (d = Math.floor(next() * 1501)) : 2000 - d) }],
  ['skewed', () => (i) => (i % 16 === 15 ? 17000 : 1000)],
]
export const cases = SHAPES.map(([, shape], f) => {
  const next = rng(101 + f * 13)
  const seeds = Array.from({ length: JOBS }, () => 1 + Math.floor(next() * 4294967295))
  const roundsOf = shape(next)
  const rounds = Array.from({ length: JOBS }, (_, i) => roundsOf(i))
  return { input: { threads: THREADS, seeds, rounds }, expected: seeds.map((s, i) => job(s, rounds[i])) }
})
export const verifyOne = (i, output) => {
  const { expected } = cases[i]
  assert.ok(Array.isArray(output), `fixture ${i}: an array of results is required`)
  assert.strictEqual(output.length, expected.length, `fixture ${i}: one result per input`)
  for (const [j, value] of expected.entries()) {
    assert.strictEqual(output[j], value, `fixture ${i}: result ${j} (results in input order)`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, output] of outputs.entries()) verifyOne(i, output)
}
// The check refuses what a pool that did not do the job returns: the seeds
// unchanged, the results reversed or rotated by one, one job left undone,
// one job dropped, and another fixture's results.
for (const [i, { input, expected }] of cases.entries()) {
  assert.throws(() => verifyOne(i, input.seeds))
  assert.throws(() => verifyOne(i, [...expected].reverse()))
  assert.throws(() => verifyOne(i, [...expected.slice(1), expected[0]]))
  assert.throws(() => verifyOne(i, expected.map((v, j) => (j === 77 ? input.seeds[j] : v))))
  assert.throws(() => verifyOne(i, expected.slice(0, -1)))
  assert.throws(() => verifyOne(i, cases[(i + 1) % cases.length].expected))
  verifyOne(i, expected)
}
// No JavaScript adapter exists for this task; these are here for one that
// runs the jobs on worker threads.
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (output) => output.length
