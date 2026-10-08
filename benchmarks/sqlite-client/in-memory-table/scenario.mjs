import { strict as assert } from 'node:assert'

// Each fixture is a list of rows [id, name, score, flag, note]:
// id is an integer above 2^32 (so it needs 64 bits), name is text with
// non-ASCII characters, score is a real that is never a whole number, flag is
// 0 or 1, note is text or null. The ids are a permutation, so the insertion
// order differs from the order of the ids and from the order of the scores.
const makeRows = (n) =>
  Array.from({ length: n }, (_, i) => [
    4294967296 + ((i * 7) % n) + 1,
    `name-${i} ünï 日本`,
    ((i * 37) % 101) + 0.25,
    i % 3 === 0 ? 1 : 0,
    i % 4 === 0 ? null : `note ${i} "q" é`,
  ])

export const cases = [200, 500, 1000].map((n) => {
  const input = makeRows(n)
  assert.equal(new Set(input.map((r) => r[0])).size, n, 'ids are distinct')
  // Expected: every row, ordered by score, then id (the scenario's own sort).
  const expected = input.map((r) => r.slice()).sort((a, b) => a[2] - b[2] || a[0] - b[0])
  return { input, expected }
})

// A row is an array of five values, or an object with the five column names.
const COLUMNS = ['id', 'name', 'score', 'flag', 'note']
const asArray = (row, path) => {
  if (Array.isArray(row)) return row
  assert.ok(row !== null && typeof row === 'object', `${path}: a row must be an array or an object`)
  assert.deepEqual(Object.keys(row), COLUMNS, `${path}: column names and order`)
  return COLUMNS.map((c) => row[c])
}

export const verifyOne = (i, output) => {
  const { input, expected } = cases[i]
  assert.ok(Array.isArray(output), `fixture ${i}: rows must be a list`)
  assert.equal(output.length, expected.length, `fixture ${i}: row count`)
  for (let r = 0; r < expected.length; r++) {
    const path = `fixture ${i} row ${r}`
    const got = asArray(output[r], path)
    const want = expected[r]
    assert.equal(got.length, 5, `${path}: five columns`)
    assert.equal(typeof got[0], 'number', `${path}: id is a number`)
    assert.ok(Number.isInteger(got[0]), `${path}: id is an integer`)
    assert.equal(got[0], want[0], `${path}: id (ordering by score then id)`)
    assert.equal(typeof got[1], 'string', `${path}: name is text`)
    assert.equal(got[1], want[1], `${path}: name`)
    assert.equal(typeof got[2], 'number', `${path}: score is a number`)
    assert.equal(got[2], want[2], `${path}: score`)
    assert.ok(got[3] === 0 || got[3] === 1, `${path}: flag is 0 or 1 (got ${got[3]})`)
    assert.equal(got[3], want[3], `${path}: flag`)
    if (want[4] === null) assert.ok(got[4] === null, `${path}: note must be null`)
    else {
      assert.equal(typeof got[4], 'string', `${path}: note is text`)
      assert.equal(got[4], want[4], `${path}: note`)
    }
  }
  // The input is not already in the answer's order: returning it fails above.
  assert.notDeepEqual(input.map((r) => r[0]), expected.map((r) => r[0]), 'fixture is not pre-sorted')
}

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  outputs.forEach((o, i) => verifyOne(i, o))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (rows) => rows.length
