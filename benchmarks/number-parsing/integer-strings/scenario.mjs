import { strict as assert } from 'node:assert'

// Each fixture is a batch of 1,000 decimal integer strings; one operation
// parses the whole batch and returns an array of integers in order. Every
// string has an optional sign and 1 to 15 digits, so every value is below
// 10^15 in magnitude and exact in a double. The scenario knows each value
// without parsing: it builds the number and its text together, from digits it
// chose (the sign and any leading zeros are text only).
let state = 20261009
const rnd = (n) => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return (state >>> 8) % n }
const PER_CASE = 1000
// A value of exactly `n` digits (no leading zero), built digit by digit.
const ofLength = (n) => {
  let text = String(1 + rnd(9))
  while (text.length < n) text += rnd(10)
  return text
}
// One entry: the text and its value. `sign` is '', '-' or '+'; `zeros` adds
// leading zeros while staying within 15 digits.
const entry = (digits, sign = '', zeros = 0) => {
  const pad = Math.max(0, Math.min(zeros, 15 - digits.length))
  const magnitude = Number(digits)
  // A negative zero is never written: "-0" would be -0 in JavaScript and 0
  // elsewhere, which is a spelling of the result, not a parse.
  const s = digits === '0' && sign === '-' ? '' : sign
  return { text: s + '0'.repeat(pad) + digits, value: s === '-' ? -magnitude : magnitude }
}
const signOf = (minus, plus) => { const r = rnd(100); return r < minus ? '-' : r < minus + plus ? '+' : '' }
const mixes = [
  // Uniform length 1 to 15, a fifth negative, a few with '+'.
  () => entry(ofLength(1 + rnd(15)), signOf(20, 3)),
  // Short identifiers and counts: 1 to 4 digits, unsigned.
  () => entry(rnd(10) === 0 ? '0' : ofLength(1 + rnd(4))),
  // 5 to 10 digits, around the 32-bit range, a tenth negative.
  () => entry(ofLength(5 + rnd(6)), signOf(10, 0)),
  // 11 to 15 digits: timestamps in milliseconds, large ids, half negative.
  () => entry(ofLength(11 + rnd(5)), signOf(50, 0)),
  // Signed: every string has a sign, '-' or '+', and some leading zeros.
  () => entry(ofLength(1 + rnd(12)), rnd(2) ? '-' : '+', rnd(4) === 0 ? 1 + rnd(3) : 0),
]
const edges = [
  ['0'], ['+0'], ['0000'], ['007'], ['-0042'], ['+000123'], ['1'], ['-1'], ['+1'], ['9'], ['10'], ['-10'],
  ['127'], ['-128'], ['255'], ['32767'], ['-32768'], ['65535'], ['2147483647'], ['-2147483648'], ['2147483648'],
  ['4294967295'], ['4294967296'], ['-4294967296'], ['99999999999999'], ['100000000000000'],
  ['999999999999999'], ['-999999999999999'], ['+999999999999999'], ['000000000000001'], ['-000000000000009'],
].map(([t]) => t)
const valueOfEdge = (t) => { const m = Number(t.replace(/^[+-]/, '')); return t[0] === '-' ? -m : m }
const batches = mixes.map((make) => Array.from({ length: PER_CASE }, make))
// A last batch: every edge value, then entries from all the mixes in turn.
batches.push([
  ...edges.map((text) => ({ text, value: valueOfEdge(text) })),
  ...Array.from({ length: PER_CASE - edges.length }, (_, j) => mixes[j % mixes.length]()),
])
export const cases = batches.map((batch) => ({ input: batch.map((e) => e.text), expected: batch.map((e) => e.value) }))

// The fixtures are what task.md says: 1 to 15 digits after an optional sign,
// nothing else, every value a safe integer, no "-0".
for (const { input, expected } of cases) {
  assert.equal(input.length, PER_CASE)
  for (const [j, text] of input.entries()) {
    assert.match(text, /^[+-]?[0-9]{1,15}$/)
    assert.notEqual(text.replace(/^-0+$/, '-0'), '-0')
    assert.ok(Number.isSafeInteger(expected[j]) && !Object.is(expected[j], -0))
  }
}

export const verifyOne = (i, actual) => {
  const { input, expected } = cases[i]
  assert.ok(Array.isArray(actual), `fixture ${i}: array of integers required`)
  assert.equal(actual.length, expected.length, `fixture ${i}: one integer per string`)
  for (let j = 0; j < expected.length; j++) {
    assert.equal(typeof actual[j], 'number', `fixture ${i}[${j}] ${JSON.stringify(input[j])}: number required, got ${typeof actual[j]}`)
    assert.ok(Number.isInteger(actual[j]), `fixture ${i}[${j}] ${JSON.stringify(input[j])}: integer required, got ${actual[j]}`)
    assert.ok(actual[j] === expected[j], `fixture ${i}[${j}] ${JSON.stringify(input[j])}: expected ${expected[j]}, got ${actual[j]}`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// Proofs that the check refuses wrong outputs.
const last = cases.length - 1
const at = (i, text) => cases[i].input.indexOf(text)
assert.ok(at(last, '-2147483648') >= 0 && at(last, '+000123') >= 0 && at(last, '999999999999999') >= 0)
const replaced = (i, j, v) => cases[i].expected.map((e, k) => (k === j ? v : e))
// The strings returned as they came in, or as strings of their values.
assert.throws(() => verifyOne(0, cases[0].input), /number required/)
assert.throws(() => verifyOne(0, cases[0].expected.map(String)), /number required/)
// The sign ignored (absolute values), one value off by one, a value parsed as
// a 32-bit integer (wrapped), the largest value cut to its first 9 digits.
assert.throws(() => verifyOne(last, cases[last].expected.map(Math.abs)), /fixture/)
assert.throws(() => verifyOne(3, cases[3].expected.map((v, k) => (k === 500 ? v + 1 : v))), /fixture 3\[500\]/)
assert.throws(() => verifyOne(last, replaced(last, at(last, '2147483648'), 2147483648 | 0)), /fixture/)
assert.throws(() => verifyOne(last, replaced(last, at(last, '999999999999999'), 999999999)), /fixture/)
// A string with a sign or leading zeros read as 0 (or NaN), as a parser that
// gives up on '+' or on a leading zero would.
assert.throws(() => verifyOne(last, replaced(last, at(last, '+000123'), 0)), /fixture/)
assert.throws(() => verifyOne(last, replaced(last, at(last, '+000123'), Number.NaN)), /fixture/)
// A fraction where an integer belongs, one value missing, another fixture's results.
assert.throws(() => verifyOne(1, replaced(1, 7, cases[1].expected[7] + 0.5)), /integer required/)
assert.throws(() => verifyOne(2, cases[2].expected.slice(1)), /one integer per string/)
assert.throws(() => verifyOne(4, cases[2].expected), /fixture 4/)
