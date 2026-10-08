import { strict as assert } from 'node:assert'
// One fixture is
//   { rows: [[name, city, age, score], ...], skipCity, minAge }
// The model is User(id, name, city, age, score): id is an integer primary key
// the database assigns (1, 2, 3, ... in insertion order), name and city are
// text, age and score are integers. An operation creates the table in a
// database that is empty, inserts every row as one model object, and loads
// back the users with age >= minAge and city <> skipCity, ordered by score
// descending and then id ascending. The common result is a list of
//   [id, name, city, age, score]
const cities = ['Lisbon', 'Zürich', 'São Paulo', 'Nairobi', "Coeur d'Alene", 'Osaka', 'Reykjavík', 'Quito']
const first = ['Ana', 'Bruno', 'Chloé', 'Dmitri', 'Elif', 'Farid', 'Grace', 'Hiro', "O'Neil", 'Ines', 'Jörg', 'Kofi']
const last = ['Silva', 'Müller', 'Okafor', 'Tanaka', 'García', 'Novak', 'Haddad', 'Lindqvist', 'Rossi', 'Kim']
// A small deterministic generator (a linear congruence), no clock and no randomness.
const lcg = (seed) => { let s = seed >>> 0; return (n) => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s >>> 8) % n } }
const make = (i) => {
  const rand = lcg(7919 * (i + 1))
  const count = 60 + Math.round((300 * i) / 23)
  // Scores come from a small range so that many users tie and the id decides.
  const rows = Array.from({ length: count }, (_, k) => [
    `${first[rand(first.length)]} ${last[rand(last.length)]} ${k}`,
    cities[rand(cities.length)],
    18 + rand(63),
    rand(50) * 20,
  ])
  const skipCity = cities[i % cities.length]
  const minAge = 25 + (i % 5) * 7
  const input = { rows, skipCity, minAge }
  const expected = rows
    .map(([name, city, age, score], k) => [k + 1, name, city, age, score])
    .filter(([, , city, age]) => age >= minAge && city !== skipCity)
    .sort((a, b) => b[4] - a[4] || a[0] - b[0])
  return { input, expected }
}
export const cases = Array.from({ length: 24 }, (_, i) => make(i))

// A result that does not do the job must fail: no filter, no order, ties not
// broken by id, an id taken from anywhere but the database, or values changed
// on the way (text escaped twice, numbers as text). The check is exact.
const sample = cases.map(({ expected }) => expected.length)
assert.ok(sample.every((n) => n > 10), 'every fixture must return some rows')
assert.ok(cases.every(({ input, expected }) => expected.length < input.rows.length), 'the filter must drop rows')
assert.ok(cases.every(({ expected }) => expected.some((r, k) => k > 0 && r[4] === expected[k - 1][4])), 'the order needs ties')

export const verifyOne = (i, output) => {
  const { input, expected } = cases[i]
  assert.ok(Array.isArray(output), `fixture ${i}: a list of rows is required`)
  assert.equal(output.length, expected.length, `fixture ${i}: ${output.length} rows returned, ${expected.length} expected (minAge ${input.minAge}, skipCity ${input.skipCity})`)
  for (const [k, row] of output.entries()) {
    assert.ok(Array.isArray(row) && row.length === 5, `fixture ${i}, row ${k}: [id, name, city, age, score] is required`)
    for (const j of [0, 3, 4]) assert.ok(Number.isInteger(row[j]), `fixture ${i}, row ${k}: field ${j} must be an integer, got ${JSON.stringify(row[j])}`)
    for (const j of [1, 2]) assert.equal(typeof row[j], 'string', `fixture ${i}, row ${k}: field ${j} must be text`)
    assert.deepEqual(row, expected[k], `fixture ${i}, row ${k}`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
