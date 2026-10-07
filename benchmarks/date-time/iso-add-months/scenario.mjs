import { strict as assert } from 'node:assert'
const pad = (n, w = 2) => String(n).padStart(w, '0')
const daysIn = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
// Independent oracle: UTC arithmetic with month-end clamping.
const reference = ({ ts, months, days }) => {
  const [, Y, M, D, h, mi, s] = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)$/.exec(ts).map(Number)
  const total = Y * 12 + (M - 1) + months
  const y = Math.floor(total / 12), m = total - y * 12
  const d = Math.min(D, daysIn(y, m))
  const t = new Date(Date.UTC(y, m, d + days, h, mi, s))
  return `${pad(t.getUTCFullYear(), 4)}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())}`
}
const offsets = [[1, 0], [-1, 0], [12, 3], [0, 30], [0, -45], [13, -1], [-25, 10], [6, 100], [1, 1], [120, 0], [-400, -400], [400, 400], [3, -7], [2, 29]]
const dates = [[2024, 1, 31], [2023, 1, 31], [2024, 2, 29], [2023, 3, 30], [2020, 12, 31], [2021, 5, 31], [1999, 12, 31], [2000, 2, 29], [2100, 1, 30], [2012, 8, 31], [1990, 6, 15], [2050, 10, 31]]
const caseList = Array.from({ length: 48 }, (_, i) => {
  const [y, mo, d] = dates[i % dates.length]
  const [months, days] = offsets[(i * 5 + (i >> 2)) % offsets.length]
  const ts = `${pad(y, 4)}-${pad(mo)}-${pad(d)}T${pad(6 + (i * 7) % 16)}:${pad((i * 13) % 60)}:${pad((i * 29 + 5) % 60)}`
  const input = { ts, months, days }
  return { input, expected: reference(input) }
})
export const cases = caseList
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
