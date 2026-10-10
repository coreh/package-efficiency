import { strict as assert } from 'node:assert'
const mapFn = (x) => x * 3 + 1
const keep = (x) => x % 5 !== 0
// Positions (0-based) in `data` of the values whose mapped value survives the filter.
const survivorsAt = (data) => data.flatMap((x, i) => (keep(mapFn(x)) ? [i] : []))
const reference = (data, limit) => {
  const at = survivorsAt(data)
  const sum = at.slice(0, limit).reduce((a, i) => a + mapFn(data[i]), 0)
  // How many values the source has yielded when the sum is known:
  // tight: take stops as soon as it has `limit` values (nothing when limit is 0);
  // lookahead: take asks for one more value before it stops, so the source is
  // read up to and including the next survivor (or to its end).
  const tight = limit === 0 ? 0 : limit <= at.length ? at[limit - 1] + 1 : data.length
  const lookahead = limit < at.length ? at[limit] + 1 : data.length
  return { sum, pulled: [tight, lookahead], survivors: at.length }
}
let seed = 12345
const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648)
const sizes = [50, 120, 300, 800, 2000, 5000]
export const cases = Array.from({ length: 48 }, (_, i) => {
  const n = sizes[i % sizes.length] + (i % 7) * 11
  const data = Array.from({ length: n }, () => next() % 100000)
  const survivors = survivorsAt(data).length
  const limit = [Math.floor(survivors / 4), survivors, survivors + 50, Math.floor(survivors / 2), 7, Math.floor(survivors * 0.9)][i % 6]
  const { sum, pulled } = reference(data, limit)
  return { input: [data, limit], expected: { sum, pulled } }
})
cases.push({ input: [[1, 2, 3], 0], expected: { sum: 0, pulled: [0, 1] } })
// [1, 2, 3] maps to [4, 7, 10]; 10 is dropped, so the first survivor is at index 0.
assert.deepStrictEqual(reference([1, 2, 3], 0), { sum: 0, pulled: [0, 1], survivors: 2 })
const verifyOne = (i, output) => {
  const { expected } = cases[i]
  assert.ok(output && typeof output === 'object', `fixture ${i}: an object { sum, pulled } is required`)
  assert.equal(typeof output.sum, 'number', `fixture ${i}: sum must be a number`)
  assert.equal(output.sum, expected.sum, `fixture ${i}: sum`)
  assert.equal(typeof output.pulled, 'number', `fixture ${i}: pulled must be a number`)
  assert.ok(expected.pulled.includes(output.pulled),
    `fixture ${i}: the source yielded ${output.pulled} values; take needs ${expected.pulled[0]} (or ${expected.pulled[1]} with one look-ahead pull)`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
// Each operation is awaited before the next one starts.
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (output) => output.sum + output.pulled
// The check must accept both read-ahead styles and refuse: a sum off by one,
// a sum that ignores the limit or the filter, a string sum, a source read to
// its end when take cut it short, one value too few or too many, and null.
for (const [i, { input: [data, limit], expected }] of cases.entries()) {
  const { sum, pulled: [tight, lookahead] } = expected
  verifyOne(i, { sum, pulled: tight })
  verifyOne(i, { sum, pulled: lookahead })
  const all = reference(data, Infinity).sum
  const unfiltered = data.slice(0, limit).reduce((a, x) => a + mapFn(x), 0)
  const wrong = [
    { sum: sum + 1, pulled: tight },
    { sum: String(sum), pulled: tight },
    { sum, pulled: tight - 1 },
    { sum, pulled: lookahead + 1 },
    { sum, pulled: String(tight) },
    null,
  ]
  if (all !== sum) wrong.push({ sum: all, pulled: data.length })
  if (unfiltered !== sum) wrong.push({ sum: unfiltered, pulled: tight })
  if (lookahead < data.length) wrong.push({ sum, pulled: data.length })
  for (const output of wrong) assert.throws(() => verifyOne(i, output), undefined, `fixture ${i}: ${JSON.stringify(output)} must be refused`)
}
// At least half the fixtures stop before the end of the source, so laziness is tested.
assert.ok(cases.filter(({ input: [data], expected }) => expected.pulled[1] < data.length).length >= cases.length / 2)
