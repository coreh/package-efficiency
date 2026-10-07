import { strict as assert } from 'node:assert'
const pad = (n, w = 2) => String(n).padStart(w, '0')
// Independent oracle: parse by hand with UTC millisecond arithmetic.
const toMs = (ts) => {
  const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.(\d+))?(Z|([+-])(\d\d):(\d\d))$/.exec(ts)
  const [Y, M, D, h, mi, s] = m.slice(1, 7).map(Number)
  const ms = m[7] ? Math.round(Number('0.' + m[7]) * 1000) : 0
  const off = m[8] === 'Z' ? 0 : (m[9] === '-' ? -1 : 1) * (Number(m[10]) * 60 + Number(m[11]))
  return Date.UTC(Y, M - 1, D, h, mi, s, ms) - off * 60000
}
const reference = ({ from, to }) => {
  const d = toMs(to) - toMs(from)
  return [Math.trunc(d / 3600000) + 0, Math.trunc(d / 60000) + 0, Math.trunc(d / 1000) + 0]
}
const offsets = ['Z', '+00:00', '-08:00', '+05:30', '+09:30', '-03:00', '+01:00', '-05:00', '+02:00', '+10:00', '-04:30', '+12:00']
const gaps = [5, 59, 61, 3599, 3600, 3601, 5400, 86399, 86400, 90061, 604800, 2678400, 31536000, 100000007, 631152000, 45296, 7261, 123456789, 999, 1800]
const caseList = Array.from({ length: 48 }, (_, i) => {
  const y = 1970 + ((i * 37) % 130)
  const mo = 1 + ((i * 5) % 12)
  const d = 1 + ((i * 11) % 28)
  const h = (i * 7) % 24, mi = (i * 13) % 60, s = (i * 29 + 5) % 60
  const frac = i % 6 === 2 ? '.25' : i % 6 === 4 ? '.5' : ''
  const o1 = offsets[i % offsets.length], o2 = offsets[(i * 5 + 3) % offsets.length]
  const from = `${pad(y, 4)}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(s)}${o1}`
  // Build "to" by shifting the instant of "from" by a gap, then rendering in o2.
  const sign = i % 3 === 1 ? -1 : 1
  const ms = toMs(from) + sign * gaps[(i * 3) % gaps.length] * 1000
  const m2 = /^([+-])(\d\d):(\d\d)$/.exec(o2)
  const off = o2 === 'Z' ? 0 : (m2[1] === '-' ? -1 : 1) * (Number(m2[2]) * 60 + Number(m2[3]))
  const t = new Date(ms + off * 60000)
  const to = `${pad(t.getUTCFullYear(), 4)}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}T${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())}${frac}${o2}`
  const input = { from, to }
  return { input, expected: reference(input) }
})
export const cases = caseList
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out) && out.length === 3, `fixture ${i}: [hours, minutes, seconds] required`)
    assert.deepEqual(out.map((n) => n + 0), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
