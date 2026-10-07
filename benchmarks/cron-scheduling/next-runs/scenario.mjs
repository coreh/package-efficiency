import { strict as assert } from 'node:assert'
// Run times are checked in the process time zone; pin it to UTC so DST gaps cannot make libraries differ.
process.env.TZ = 'UTC'

const patterns = [
  '* * * * *', '*/5 * * * *', '*/15 * * * *', '0 * * * *', '30 * * * *', '0 0 * * *', '0 12 * * *',
  '15 3 * * *', '45 23 * * *', '0 9 * * 1-5', '30 8 * * mon-fri', '0 0 * * 0', '0 6 * * 6,0', '*/10 9-17 * * 1-5',
  '0 */2 * * *', '5,35 */6 * * *', '0 0 1 * *', '30 2 1 * *', '0 0 15 * *', '0 8 1,15 * *', '0 0 1 1 *',
  '0 0 1 */3 *', '0 12 25 12 *', '59 23 31 * *', '0 0 30 * *', '10-50/10 * * * *', '0 0 * jun-aug *', '0 4 * 1,7 *',
  '*/7 * * * *', '17 */4 * * *', '0 22 * * 5', '0 0 10-20 * *', '20 14 * * 2-4', '0 0,12 * * *', '*/20 0-6 * * *',
  '45 6 1-7 * *', '0 18 * * 1,3,5', '5 0 * 8 *', '0 0 L * *'.replace('L', '28'), '0 7 * * 1'
]
const starts = [
  '2026-10-06T12:34:56.789Z', '2026-01-01T00:00:00.500Z', '2027-02-28T23:59:59.001Z', '2028-02-28T10:15:30.250Z',
  '2026-12-31T23:30:15.000Z', '2026-06-15T06:07:08.900Z', '2030-07-04T17:45:00.123Z', '2026-03-29T01:30:30.000Z'
]
const names = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
const COUNT = 50

function field(text, min, max) {
  const out = new Set()
  for (const part of text.toLowerCase().split(',')) {
    const [range, step = '1'] = part.split('/')
    let lo, hi
    if (range === '*') [lo, hi] = [min, max]
    else if (range.includes('-')) [lo, hi] = range.split('-').map(v => names[v] ?? Number(v))
    else lo = hi = names[range] ?? Number(range)
    for (let v = lo; v <= hi; v += Number(step)) out.add(v)
  }
  return [...out].sort((a, b) => a - b)
}

// Independent reference: enumerate days, then the hour and minute sets.
function reference(pattern, startMs, count) {
  const [mi, ho, dom, mo, dow] = pattern.split(' ')
  const minutes = field(mi, 0, 59), hours = field(ho, 0, 23), doms = new Set(field(dom, 1, 31)), months = new Set(field(mo, 1, 12)), dows = new Set(field(dow, 0, 6))
  const out = []
  const day = new Date(startMs)
  day.setHours(0, 0, 0, 0)
  for (let guard = 0; out.length < count && guard < 80000; guard++, day.setDate(day.getDate() + 1)) {
    if (!months.has(day.getMonth() + 1) || !doms.has(day.getDate()) || !dows.has(day.getDay())) continue
    for (const h of hours) for (const m of minutes) {
      const t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0).getTime()
      if (t > startMs && out.length < count) out.push(t)
    }
  }
  return out
}

export const cases = patterns.map((pattern, i) => {
  const start = Date.parse(starts[i % starts.length])
  return { input: { pattern, start, count: COUNT }, expected: reference(pattern, start, COUNT) }
})

const times = result => Array.from(result, v => new Date(v).getTime())
export const verifyResults = outputs => {
  assert.equal(outputs.length, cases.length)
  outputs.forEach((out, i) => assert.deepEqual(times(out), cases[i].expected, cases[i].input.pattern))
}
export const verify = operation => verifyResults(cases.map(c => operation(c.input)))
export const consume = result => result.length
