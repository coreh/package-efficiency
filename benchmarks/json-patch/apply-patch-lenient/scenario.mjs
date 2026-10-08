import { strict as assert } from 'node:assert'
// The lenient task of json-patch/apply-patch: the same documents and patches,
// taken from the strict scenario, without the patches that must be rejected,
// and with a check that also accepts a copy that shares its value.
import { cases as strictCases, reference, consume as strictConsume } from '../apply-patch/scenario.mjs'

// The fixtures of the strict task whose patch applies (30 of its 36). The
// six left out end in an operation that must fail; what a package does with
// one (reject it, skip the operation, apply something else) is exactly what
// this task does not judge, and it is different work from applying a patch.
const kept = strictCases.map((c, n) => ({ ...c, n })).filter((c) => c.expected !== null)
export const cases = kept.map(({ input, expected }) => ({ input, expected }))

// What the patch gives when a copy operation shares the value with its source
// and does not duplicate it: a later change to the copy shows in the source
// too. Computed with the strict task's own reference, never from a package.
const sharing = cases.map(({ input }) => reference(JSON.parse(input.document), JSON.parse(input.patch), (value) => value))

const equal = (a, b) => { try { assert.deepStrictEqual(a, b); return true } catch { return false } }
export const verifyOne = (i, output) => {
  const where = `fixture ${i} (fixture ${kept[i].n} of the strict task)`
  assert.equal(typeof output, 'string', `${where}: the patched document must be JSON text`)
  const got = JSON.parse(output)
  if (equal(got, cases[i].expected) || equal(got, sharing[i])) return
  // Neither: report the difference from the correct result.
  assert.deepStrictEqual(got, cases[i].expected, where)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  outputs.forEach((output, i) => verifyOne(i, output))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = strictConsume

// The fixtures are what this file says they are: every patch applies, and in
// every one a shared copy gives another document than a duplicated one, so the
// two accepted results are two results and not one.
assert.equal(cases.length, 30)
for (const [i, { expected }] of cases.entries()) {
  assert.notEqual(sharing[i], null, `fixture ${i}: the patch must apply`)
  assert.ok(!equal(sharing[i], expected), `fixture ${i}: a shared copy must show`)
}
// Proofs that the check can fail: the input document unchanged, the result of
// another fixture, a constant, no result, and a document in which the copy was
// not made at all are each rejected. Both accepted results pass.
assert.throws(() => verifyOne(0, cases[0].input.document), /fixture 0/)
assert.throws(() => verifyOne(1, JSON.stringify(cases[0].expected)), /fixture 1/)
assert.throws(() => verifyOne(2, '{}'), /fixture 2/)
assert.throws(() => verifyOne(3, null), /fixture 3/)
assert.throws(() => verifyOne(4, JSON.stringify({ ...cases[4].expected, featured: undefined })), /fixture 4/)
verifyOne(5, JSON.stringify(cases[5].expected))
verifyOne(5, JSON.stringify(sharing[5]))
