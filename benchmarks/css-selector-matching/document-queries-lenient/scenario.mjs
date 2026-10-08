import { strict as assert } from 'node:assert'
// The lenient task of css-selector-matching/document-queries: the same
// document, the same check, and the selectors of the strict scenario that are
// written in Selectors Level 3 only.
import { cases as strictCases, consume as strictConsume } from '../document-queries/scenario.mjs'

// Syntax that Selectors Level 4 added and Level 3 does not have: the :is(),
// :where() and :has() pseudo-classes, :not() with a selector list or a
// combinator inside, and the case flag of an attribute selector ([a="b" i]).
// A library written to Level 3 does not match such a selector wrongly: it
// refuses to compile it (a panic, an exception, or no matches at all), which
// is an error and not a result to compare.
const level4 = (selector) => /:(?:is|where|has)\(/.test(selector) || /:not\([^)]*[\s,>+~][^)]*\)/.test(selector) || /\s[is]\s*\]/i.test(selector)
const kept = strictCases.map((c, n) => ({ ...c, n })).filter((c) => !level4(c.input.selector))
export const cases = kept.map(({ input, expected }) => ({ input, expected }))

// The check is the strict task's, on the fixtures that remain.
const number = (x) => typeof x === 'number' ? x : Number((x.attribs ?? x.attrs ?? {})['data-n'])
export const verifyOne = (i, output) => {
  const { input, expected } = cases[i]
  assert.ok(Array.isArray(output), `fixture ${i}: list of elements required`)
  assert.deepEqual(output.map(number), expected, `fixture ${i} (fixture ${kept[i].n} of the strict task): ${input.selector}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  outputs.forEach((output, i) => verifyOne(i, output))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = strictConsume

// The fixtures are what this file says they are: exactly the two Level 4
// selectors of the strict task are left out, and every kind of Level 3
// selector it has is still here.
assert.deepEqual(strictCases.map((c) => c.input.selector).filter(level4), [':is(h2, h3) + p', '[data-kind="NOTE" i]'])
assert.equal(cases.length, strictCases.length - 2)
for (const part of ['[href^=', '[href$=', '[href*=', '[class~=', '[lang|=', ' > ', ' + ', ' ~ ', ':nth-child(', ':nth-last-child(', ':nth-of-type(', ':first-of-type', ':last-of-type', ':empty', ':not(', ', ', '*']) {
  assert.ok(cases.some((c) => c.input.selector.includes(part)), `a selector with ${part} is kept`)
}
// Proofs that the check can fail: nothing matched, everything matched, and the
// matches of the neighbouring fixture are rejected for a selector that matches
// some elements and not all.
const some = cases.findIndex((c, i) => i > 0 && c.expected.length > 0 && c.input.selector !== '*')
const everything = cases.find((c) => c.input.selector === '*').expected
assert.throws(() => verifyOne(some, []), /fixture/)
assert.throws(() => verifyOne(some, everything), /fixture/)
assert.throws(() => verifyOne(some, cases[some - 1].expected), /fixture/)
assert.throws(() => verifyOne(some, cases[some].input.selector), /list of elements/)
verifyOne(some, cases[some].expected)
