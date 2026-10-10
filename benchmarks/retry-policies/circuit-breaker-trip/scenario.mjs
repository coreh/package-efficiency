import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (a 32-bit LCG); no Math.random.
const rng = (seed) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296 }
const CALLS = 500
const THRESHOLD = 5
// How long the breaker stays open before it would half-open. An operation of
// 500 calls takes well under 10 ms on the slowest runtime, so the breaker never
// half-opens during one; a longer time would only keep go-resiliency's sleeping
// goroutine (one per opening) alive for longer (see task.md).
const OPEN_MS = 100
export const OK = 'ran-ok'
export const FAILED = 'ran-failed'
export const REJECTED = 'rejected'

// One fixture is a list of 500 calls, each one that succeeds (false) or fails
// (true), sent in order through one breaker that opens after THRESHOLD
// consecutive failures and stays open for OPEN_MS, so it never half-opens
// during an operation.
//
// The packages count failures that are not consecutive differently
// (go-resiliency counts every error until an hour passes without one; gobreaker
// and pybreaker reset on a success), so no fixture has a failure before its
// first run of THRESHOLD failures: every call before it succeeds. After the
// breaker opens, calls fail or succeed at random; none of them may run.
// `trip` is where the first run of failures starts and `run` how long it is
// (null: no run of THRESHOLD, so the breaker never opens).
const shapes = [
  { trip: 0, run: 5 },        // opens on the fifth call
  { trip: 120, run: 5 },      // exactly five failures, then calls that succeed and fail
  { trip: 300, run: 9 },      // a longer run: the four failures after the fifth are rejected
  { trip: 495, run: 5 },      // the fifth failure is the last call: nothing is rejected
  { trip: 496, run: 4 },      // four failures at the end: the breaker stays closed
  { trip: null, run: 0 },     // every call succeeds
]
const build = ({ trip, run }, f) => {
  const next = rng(57 + f * 11)
  return Array.from({ length: CALLS }, (_, i) => {
    if (trip === null || i < trip) return false
    if (i < trip + run) return true
    return next() < 0.4
  })
}
// The scenario's own breaker: count consecutive failures, open at THRESHOLD,
// reject everything after.
export const reference = (fail, threshold = THRESHOLD) => {
  let consecutive = 0
  let open = false
  return fail.map((f) => {
    if (open) return REJECTED
    if (!f) { consecutive = 0; return OK }
    consecutive += 1
    if (consecutive >= threshold) open = true
    return FAILED
  })
}
export const cases = shapes.map((shape, f) => {
  const fail = build(shape, f)
  return { input: { threshold: THRESHOLD, openMs: OPEN_MS, fail }, expected: reference(fail) }
})
// The fixture rule: no failure before the first run of THRESHOLD.
for (const [f, { input }] of cases.entries()) {
  const first = input.fail.indexOf(true)
  if (first < 0) continue
  const run = input.fail.slice(first, first + THRESHOLD)
  assert.ok(run.length < THRESHOLD ? first + run.length === CALLS && run.every(Boolean) : run.every(Boolean),
    `fixture ${f}: a failure before the first run of ${THRESHOLD}`)
}

export const verifyOne = (i, output) => {
  const { input, expected } = cases[i]
  assert.ok(Array.isArray(output), `fixture ${i}: the output must be a list of outcomes`)
  assert.equal(output.length, expected.length, `fixture ${i}: one outcome per call`)
  for (const [j, want] of expected.entries()) {
    assert.strictEqual(output[j], want,
      `fixture ${i} call ${j} (${input.fail[j] ? 'fails' : 'succeeds'}): outcome ${JSON.stringify(output[j])}, expected ${want}`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (output) => output.length

// The check must refuse what is not the job.
verifyResults(cases.map(({ expected }) => expected))
const refused = (name, make) => {
  assert.throws(() => verifyResults(cases.map(({ input, expected }, i) => make(input, expected, i))), undefined, `the check accepted ${name}`)
}
// No breaker: every call runs.
refused('calls without a breaker', ({ fail }) => fail.map((f) => (f ? FAILED : OK)))
// Off by one either way.
refused('a breaker that opens after 4 failures', ({ fail }) => reference(fail, 4))
refused('a breaker that opens after 6 failures', ({ fail }) => reference(fail, 6))
// A breaker that half-opens: lets one call through after ten rejections.
refused('a breaker that half-opens', (_, expected) => {
  let rejected = 0
  return expected.map((o) => (o === REJECTED && ++rejected % 10 === 0 ? OK : o))
})
// Rejected calls reported as failed calls (the function ran).
refused('rejections reported as failures', (_, expected) => expected.map((o) => (o === REJECTED ? FAILED : o)))
// One outcome short.
refused('one outcome short', (_, expected) => expected.slice(1))
// Another fixture's outcomes.
refused('another fixture\'s outcomes', (_, __, i) => cases[(i + 1) % cases.length].expected)
// The fixtures must show each of these: an opening, rejections, a run longer
// than the threshold and a breaker that stays closed with failures.
assert.ok(cases.some(({ expected }) => expected.includes(REJECTED)))
assert.ok(cases.some(({ expected }) => expected.includes(FAILED) && !expected.includes(REJECTED)))
assert.ok(cases.some(({ input, expected }) => expected.some((o, j) => o === REJECTED && input.fail[j])))
