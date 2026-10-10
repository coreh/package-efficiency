import { strict as assert } from 'node:assert'
// Reference: the daylight-saving rules each zone has followed throughout
// 2012-2024, written out by hand from the tz database, so the expected values
// come from no entry. At load they are checked against the runtime's Intl
// (ICU's copy of the tz database) for every instant of every fixture.
const DAY = 86400
const pad = (n, w = 2) => String(n).padStart(w, '0')
// Seconds since the epoch of a civil date-time, read as if it were UTC.
const civil = (y, m, d, h = 0, mi = 0, s = 0) => Date.UTC(y, m - 1, d, h, mi, s) / 1000
// Day of the month of the n-th Sunday (n = -1: the last) of a month.
const sunday = (y, m, n) => {
  if (n > 0) {
    const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
    return 1 + ((7 - first) % 7) + (n - 1) * 7
  }
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return lastDay - new Date(Date.UTC(y, m - 1, lastDay)).getUTCDay()
}
// Each rule gives, for a year, the UTC instants at which daylight time starts
// and ends, from the zone's standard and daylight offsets (seconds east).
const rules = {
  // United States and Canada since 2007 (Newfoundland at 02:00 since 2011):
  // second Sunday of March 02:00 standard, first Sunday of November 02:00 daylight.
  us: (y, std, dst) => [civil(y, 3, sunday(y, 3, 2), 2) - std, civil(y, 11, sunday(y, 11, 1), 2) - dst],
  // European Union: last Sunday of March and of October, 01:00 UTC.
  eu: (y) => [civil(y, 3, sunday(y, 3, -1), 1), civil(y, 10, sunday(y, 10, -1), 1)],
  // South Australia since 2008: first Sunday of October 02:00 standard,
  // first Sunday of April 03:00 daylight (02:00 standard).
  au: (y, std) => [civil(y, 10, sunday(y, 10, 1), 2) - std, civil(y, 4, sunday(y, 4, 1), 2) - std],
  // Lord Howe Island since 2008, a 30-minute shift at 02:00 wall-clock time:
  // first Sunday of October 02:00 standard, first Sunday of April 02:00 daylight.
  lh: (y, std, dst) => [civil(y, 10, sunday(y, 10, 1), 2) - std, civil(y, 4, sunday(y, 4, 1), 2) - dst],
  // New Zealand since 2007-2008 (Chatham at 02:45 local standard, the same
  // instant): last Sunday of September 02:00 NZST, first Sunday of April 02:00 NZST.
  nz: (y) => [civil(y, 9, sunday(y, 9, -1), 2) - 43200, civil(y, 4, sunday(y, 4, 1), 2) - 43200],
}
export const zones = [
  { zone: 'America/New_York', std: -18000, dst: -14400, rule: 'us' },
  { zone: 'America/Los_Angeles', std: -28800, dst: -25200, rule: 'us' },
  { zone: 'America/St_Johns', std: -12600, dst: -9000, rule: 'us' },
  { zone: 'Europe/London', std: 0, dst: 3600, rule: 'eu' },
  { zone: 'Europe/Berlin', std: 3600, dst: 7200, rule: 'eu' },
  { zone: 'Asia/Kolkata', std: 19800 },
  { zone: 'Asia/Kathmandu', std: 20700 },
  { zone: 'Asia/Tokyo', std: 32400 },
  { zone: 'Australia/Adelaide', std: 34200, dst: 37800, rule: 'au' },
  { zone: 'Australia/Lord_Howe', std: 37800, dst: 39600, rule: 'lh' },
  { zone: 'Pacific/Auckland', std: 43200, dst: 46800, rule: 'nz' },
  { zone: 'Pacific/Chatham', std: 45900, dst: 49500, rule: 'nz' },
]
const FIRST_YEAR = 2012, LAST_YEAR = 2024
const START = civil(FIRST_YEAR, 1, 1), END = civil(LAST_YEAR + 1, 1, 1)
const offsetAt = ({ std, dst, rule }, t) => {
  if (!rule) return std
  const y = new Date(t * 1000).getUTCFullYear()
  const [start, end] = rules[rule](y, std, dst)
  // Northern zones: daylight between start and end of the same year.
  // Southern zones: daylight from January until end, and from start on.
  const daylight = start < end ? t >= start && t < end : t >= start || t < end
  return daylight ? dst : std
}
const wallClock = (t, offset) => {
  const d = new Date((t + offset) * 1000)
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}
export const reference = (z, t) => {
  const offset = offsetAt(z, t)
  return [wallClock(t, offset), offset]
}
// Instants, deterministic: for daylight-saving zones, 1 s before, at, 1 s
// after and 30 min after 15 transitions spread over the years (the skipped
// and the repeated hour), then 140 instants spread over 2012-2024 by a
// fixed-seed generator; for fixed-offset zones, 200 spread instants with a
// few at local midnight and year ends.
const instantsFor = (z, index) => {
  let x = (index + 1) * 2654435761 >>> 0 || 1
  const next = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x }
  const out = []
  if (z.rule) {
    const transitions = []
    for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) transitions.push(...rules[z.rule](y, z.std, z.dst))
    transitions.sort((a, b) => a - b)
    for (let k = 0; k < 15; k++) {
      const t = transitions[Math.floor((k * (transitions.length - 1)) / 14)]
      out.push(t - 1, t, t + 1, t + 1800)
    }
  } else {
    for (let y = FIRST_YEAR; y <= LAST_YEAR; y += 3) out.push(civil(y, 1, 1) - z.std, civil(y, 12, 31, 23, 59, 59) - z.std)
  }
  while (out.length < 200) out.push(START + (next() % (END - START - DAY)))
  return out
}
export const cases = zones.map((z, i) => {
  const instants = instantsFor(z, i)
  return { input: { zone: z.zone, instants }, expected: instants.map((t) => reference(z, t)) }
})
// Check the reference against Intl for every instant of every fixture.
for (const [i, z] of zones.entries()) {
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: z.zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  })
  for (const [k, t] of cases[i].input.instants.entries()) {
    const p = Object.fromEntries(format.formatToParts(new Date(t * 1000)).map(({ type, value }) => [type, Number(value)]))
    const local = civil(p.year, p.month, p.day, p.hour, p.minute, p.second)
    assert.deepEqual([wallClock(local, 0), local - t], cases[i].expected[k], `reference disagrees with Intl: ${z.zone} at ${t}`)
  }
}
export const verifyOne = (i, output) => {
  const { expected } = cases[i]
  assert.ok(Array.isArray(output), `fixture ${i}: a list of [local date-time, offset] pairs is required`)
  assert.equal(output.length, expected.length, `fixture ${i}: one pair per instant is required`)
  for (const [k, pair] of output.entries()) {
    assert.ok(Array.isArray(pair) && pair.length === 2, `fixture ${i}, instant ${k}: a [local date-time, offset] pair is required`)
    assert.ok(typeof pair[0] === 'string' && Number.isInteger(pair[1]), `fixture ${i}, instant ${k}: a string and an integer are required`)
    assert.deepEqual([pair[0], pair[1] + 0], expected[k], `fixture ${i} (${cases[i].input.zone}), instant ${k} (${cases[i].input.instants[k]})`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
// The check refuses wrong answers: UTC instead of local time, standard time
// all year, an offset in minutes, one second off, the offset written into the
// date-time, and another zone's results.
const expectedOutputs = cases.map(({ expected }) => expected)
const refused = (change) => assert.throws(() => verifyResults(change(expectedOutputs.map((pairs) => pairs.map((p) => [...p])))))
assert.doesNotThrow(() => verifyResults(expectedOutputs))
refused((all) => all.map((pairs, i) => cases[i].input.instants.map((t) => [wallClock(t, 0), 0])))
refused((all) => all.map((pairs, i) => cases[i].input.instants.map((t) => [wallClock(t, zones[i].std), zones[i].std])))
refused((all) => all.map((pairs) => pairs.map(([s, o]) => [s, o / 60])))
refused((all) => { all[3][7] = [wallClock(cases[3].input.instants[7] + 1, all[3][7][1]), all[3][7][1]]; return all })
refused((all) => all.map((pairs) => pairs.map(([s, o]) => [`${s}${o < 0 ? '-' : '+'}${pad(Math.floor(Math.abs(o) / 3600))}:${pad((Math.abs(o) % 3600) / 60)}`, o])))
refused((all) => [all[1], ...all.slice(1)])
