import { strict as assert } from 'node:assert'
// An input is { seed, count }: seed the library's generator with `seed`, then
// produce `count` records. Fixture 8 repeats the seed of fixture 0, so the
// same seed must give the same records.
const seeds = [101, 202, 303, 404, 505, 606, 707, 808, 101]
export const cases = seeds.map((seed) => ({ input: { seed, count: 100 } }))

const EMAIL = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const distinct = (records, key) => new Set(records.map((r) => r[key])).size

const checkRecord = (where, r) => {
  assert.ok(r && typeof r === 'object' && !Array.isArray(r), `${where}: a record must be an object`)
  assert.deepEqual(Object.keys(r).sort(), ['date', 'email', 'name', 'street'], `${where}: a record has exactly name, email, street and date`)
  for (const key of ['name', 'email', 'street', 'date']) assert.equal(typeof r[key], 'string', `${where}: ${key} must be a string`)
  assert.ok(/\p{L}/u.test(r.name) && r.name.trim() === r.name && r.name.split(/\s+/).length >= 2, `${where}: name must be two or more words: ${r.name}`)
  assert.ok(!/[\d@]/.test(r.name), `${where}: name must not hold digits or @: ${r.name}`)
  assert.ok(EMAIL.test(r.email), `${where}: not an email: ${r.email}`)
  assert.ok(/\d/.test(r.street) && /\p{L}/u.test(r.street) && r.street.trim() === r.street && r.street.length >= 5 && !r.street.includes('@'), `${where}: street must hold a number and a name: ${r.street}`)
  const m = DATE.exec(r.date)
  assert.ok(m, `${where}: not an ISO date: ${r.date}`)
  const [y, mo, d] = [+m[1], +m[2], +m[3]]
  const t = new Date(Date.UTC(y, mo - 1, d))
  assert.ok(t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d, `${where}: not a calendar date: ${r.date}`)
  assert.ok(y >= 1900 && y <= 2100, `${where}: year out of range: ${r.date}`)
}
const checkSet = (i, records) => {
  assert.ok(Array.isArray(records), `fixture ${i}: a list of records is required`)
  assert.equal(records.length, cases[i].input.count, `fixture ${i}: wrong number of records`)
  records.forEach((r, k) => checkRecord(`fixture ${i} record ${k}`, r))
  const n = records.length
  assert.ok(distinct(records, 'name') >= n / 2, `fixture ${i}: fewer than half the names are distinct`)
  assert.ok(distinct(records, 'email') >= n / 2, `fixture ${i}: fewer than half the emails are distinct`)
  assert.ok(distinct(records, 'street') >= n / 2, `fixture ${i}: fewer than half the streets are distinct`)
  assert.ok(distinct(records, 'date') >= n / 4, `fixture ${i}: too few distinct dates`)
}
const same = (a, b) => a.length === b.length && a.every((r, k) => r.name === b[k].name && r.email === b[k].email && r.street === b[k].street && r.date === b[k].date)
const equalCount = (a, b) => a.filter((r, k) => r.name === b[k].name && r.email === b[k].email).length

// Shape and variety of one fixture's output. The seed relations (same seed,
// same records; another seed, other records) are checked across fixtures.
export const verifyOne = (i, output) => checkSet(i, output)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
  for (const i of cases.keys()) for (let j = i + 1; j < cases.length; j++) {
    if (cases[i].input.seed === cases[j].input.seed) assert.ok(same(outputs[i], outputs[j]), `fixtures ${i} and ${j} share a seed and must give the same records`)
    else assert.ok(equalCount(outputs[i], outputs[j]) < outputs[i].length / 2, `fixtures ${i} and ${j} have different seeds and must give different records`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
// A constant answer must not pass: the same records for every seed fail the seed relation.
{
  const fixed = Array.from({ length: 100 }, (_, k) => ({ name: `Ann Name${String.fromCharCode(97 + (k % 26))}${String.fromCharCode(97 + ((k / 26) | 0))}`, email: `a${k}@example.com`, street: `${k + 1} Main St${k}`, date: `2000-01-${String(1 + (k % 28)).padStart(2, '0')}` }))
  assert.throws(() => verifyResults(cases.map(() => fixed)))
}
