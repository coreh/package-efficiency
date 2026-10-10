import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (a 32-bit LCG); no Math.random.
const rng = (seed) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296 }
// Four worker threads, always: the thread count is part of the task
// (task.json load.threads).
const THREADS = 4
const JOBS = 64
// The job, written out the same way in every worker module: `rounds` steps of
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
// The expected values are not computed with that loop: 512 million steps per
// fixture would take seconds every time the scenario is loaded. One step of
// xorshift32 is linear over GF(2), so `rounds` steps are the step's 32x32 bit
// matrix raised to the power `rounds`, by repeated squaring. A matrix is its
// 32 columns, the images of the 32 one-bit vectors.
const apply = (cols, x) => { let y = 0; for (let j = 0; j < 32; j++) if ((x >>> j) & 1) y ^= cols[j]; return y >>> 0 }
const compose = (a, b) => b.map((col) => apply(a, col)) // a after b
const IDENTITY = Array.from({ length: 32 }, (_, j) => (1 << j) >>> 0)
const STEP = IDENTITY.map((e) => job(e, 1))
const power = (rounds) => {
  let result = IDENTITY, base = STEP
  for (let n = rounds; n > 0; n = Math.floor(n / 2)) {
    if (n % 2 === 1) result = compose(base, result)
    base = compose(base, base)
  }
  return result
}
const jump = (seed, rounds) => apply(power(rounds), seed)
// The reference agrees with the loop, from 0 steps up and at a few longer counts.
{
  const next = rng(7)
  for (let rounds = 0; rounds < 70; rounds++) {
    const seed = 1 + Math.floor(next() * 4294967295)
    assert.strictEqual(jump(seed, rounds), job(seed, rounds), `matrix power at ${rounds} steps`)
  }
  for (const rounds of [1000, 4097, 65536, 100003]) assert.strictEqual(jump(12345, rounds), job(12345, rounds), `matrix power at ${rounds} steps`)
}
// Three shapes of the same total work (512,000,000 steps in each fixture):
// every job alike; jobs of varied length, 4 to 12 million steps, in pairs that
// add up to 16 million; and a few long jobs among short ones.
const SHAPES = [
  ['even', () => () => 8_000_000],
  ['varied', (next) => { let d = 0; return (i) => (i % 2 === 0 ? 8_000_000 + (d = Math.floor(next() * 4_000_001)) : 8_000_000 - d) }],
  ['skewed', () => (i) => (i % 16 === 15 ? 68_000_000 : 4_000_000)],
]
export const cases = SHAPES.map(([, shape], f) => {
  const next = rng(211 + f * 17)
  const seeds = Array.from({ length: JOBS }, () => 1 + Math.floor(next() * 4294967295))
  const roundsOf = shape(next)
  const rounds = Array.from({ length: JOBS }, (_, i) => roundsOf(i))
  assert.strictEqual(rounds.reduce((a, b) => a + b, 0), 512_000_000)
  return { input: { threads: THREADS, seeds, rounds }, expected: seeds.map((s, i) => jump(s, rounds[i])) }
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
// one job run one step short, one job dropped, results as text, and another
// fixture's results.
for (const [i, { input, expected }] of cases.entries()) {
  assert.throws(() => verifyOne(i, input.seeds))
  assert.throws(() => verifyOne(i, [...expected].reverse()))
  assert.throws(() => verifyOne(i, [...expected.slice(1), expected[0]]))
  assert.throws(() => verifyOne(i, expected.map((v, j) => (j === 37 ? input.seeds[j] : v))))
  assert.throws(() => verifyOne(i, expected.map((v, j) => (j === 15 ? jump(input.seeds[j], input.rounds[j] - 1) : v))))
  assert.throws(() => verifyOne(i, expected.slice(0, -1)))
  assert.throws(() => verifyOne(i, expected.map(String)))
  assert.throws(() => verifyOne(i, cases[(i + 1) % cases.length].expected))
  verifyOne(i, expected)
}
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (output) => output.length
