import { strict as assert } from 'node:assert'
// Each string is built from the components it writes, so the total in seconds
// is known without parsing. A second, independent reading (a strict regular
// expression over the text) is checked against it for every string at load.
const pad = (n, w) => String(n).padStart(w, '0')
const COUNT = 200
const rng = (seed) => {
  let x = (seed * 2654435761) >>> 0 || 1
  return (n) => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x % n }
}
// A duration as written: the parts present, in the order h, m, s.
const write = ({ h, m, s }, zeroPad = false) => {
  let text = ''
  if (h !== undefined) text += `${h}h`
  if (m !== undefined) text += `${zeroPad && h !== undefined ? pad(m, 2) : m}m`
  if (s !== undefined) text += `${zeroPad && (h !== undefined || m !== undefined) ? pad(s, 2) : s}s`
  return text
}
const total = ({ h = 0, m = 0, s = 0 }) => h * 3600 + m * 60 + s
// The edges every fixture 0 starts with.
const edges = [
  { h: 1, m: 30, s: 15 }, { m: 45 }, { s: 90 }, { s: 0 }, { m: 0 }, { h: 0 },
  { h: 1 }, { h: 1, s: 5 }, { h: 1, m: 0, s: 0 }, { h: 0, m: 0, s: 1 }, { m: 59, s: 59 },
  { m: 60 }, { s: 60 }, { s: 3600 }, { s: 86400 }, { m: 1440 }, { h: 24 }, { h: 9999, m: 59, s: 59 },
  { h: 100 }, { m: 119, s: 59 }, { h: 2, m: 75 }, { h: 3, m: 5, s: 120 },
]
const mixes = [
  // 0: the edges, then everything below in turn.
  null,
  // 1: hours, minutes and seconds, minutes and seconds below 60 (how Go writes a Duration).
  (r) => ({ h: 1 + r(48), m: r(60), s: r(60) }),
  // 2: minutes and seconds, or one of them alone.
  (r) => [() => ({ m: 1 + r(59), s: r(60) }), () => ({ m: 1 + r(180) }), () => ({ s: 1 + r(600) })][r(3)](),
  // 3: seconds alone, up to a day.
  (r) => ({ s: r(86401) }),
  // 4: hours alone, and hours with minutes.
  (r) => (r(2) ? { h: 1 + r(72) } : { h: r(24), m: 1 + r(59) }),
  // 5: long spans, 100 to 9,999 hours, with minutes and seconds.
  (r) => ({ h: 100 + r(9900), m: r(60), s: r(60) }),
  // 6: zero components written out, and minutes and seconds zero-padded to two digits.
  (r) => [() => ({ h: 1 + r(12), m: 0, s: 0 }), () => ({ h: 0, m: 1 + r(59), s: 0 }), () => ({ m: 0, s: 1 + r(59) }), () => ({ h: r(10), m: r(60), s: r(60), pad: true })][r(4)](),
  // 7: minutes or seconds above 59 next to a larger unit, as people write them.
  (r) => [() => ({ h: r(5), m: 60 + r(120) }), () => ({ m: r(10), s: 60 + r(240) }), () => ({ h: 1 + r(3), m: r(60), s: 60 + r(3540) })][r(3)](),
]
const durationsFor = (index) => {
  const r = rng(index + 1)
  const out = []
  if (index === 0) {
    out.push(...edges)
    while (out.length < COUNT) out.push(mixes[1 + (out.length % (mixes.length - 1))](r))
  } else {
    while (out.length < COUNT) out.push(mixes[index](r))
  }
  return out
}
export const cases = mixes.map((_, i) => {
  const parts = durationsFor(i)
  return { input: parts.map((p) => write(p, p.pad)), expected: parts.map(total) }
})
// Second reading of every string, by a strict pattern, against the generator.
const PATTERN = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/
for (const [i, { input, expected }] of cases.entries()) {
  assert.equal(input.length, COUNT)
  for (const [k, text] of input.entries()) {
    const m = PATTERN.exec(text)
    assert.ok(m && text !== '', `fixture ${i}, string ${k}: ${text}`)
    const [h, mi, s] = m.slice(1).map((v) => (v === undefined ? 0 : Number(v)))
    assert.equal(h * 3600 + mi * 60 + s, expected[k], `fixture ${i}, string ${k}: ${text}`)
  }
}
export const verifyOne = (i, output) => {
  const { input, expected } = cases[i]
  assert.ok(Array.isArray(output), `fixture ${i}: a list of totals in seconds is required`)
  assert.equal(output.length, expected.length, `fixture ${i}: one total per string is required`)
  for (const [k, value] of output.entries()) {
    assert.ok(typeof value === 'number' && Number.isFinite(value), `fixture ${i}, string ${k} (${input[k]}): a number is required, got ${JSON.stringify(value)}`)
    assert.equal(value + 0, expected[k], `fixture ${i}, string ${k} (${input[k]})`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
// The check refuses wrong answers: the strings returned unchanged, totals in
// minutes, only the first component read, `m` read as months (30 days) or as
// milliseconds, totals as strings, one total off by one, a missing total and
// another fixture's results.
const expectedOutputs = cases.map(({ expected }) => expected)
const refused = (change) => assert.throws(() => verifyResults(change(expectedOutputs.map((list) => [...list]))))
const readWith = (unit) => cases.map(({ input }) => input.map((t) => {
  const m = PATTERN.exec(t)
  return (m[1] ? Number(m[1]) * unit.h : 0) + (m[2] ? Number(m[2]) * unit.m : 0) + (m[3] ? Number(m[3]) * unit.s : 0)
}))
assert.doesNotThrow(() => verifyResults(expectedOutputs))
assert.doesNotThrow(() => verifyResults(readWith({ h: 3600, m: 60, s: 1 })))
refused(() => cases.map(({ input }) => input))
refused((all) => all.map((list) => list.map((v) => v / 60)))
refused(() => cases.map(({ input }) => input.map((t) => { const m = /^(\d+)([hms])/.exec(t); return Number(m[1]) * { h: 3600, m: 60, s: 1 }[m[2]] })))
refused(() => readWith({ h: 3600, m: 2592000, s: 1 }))
refused(() => readWith({ h: 3600, m: 0.001, s: 1 }))
refused((all) => all.map((list) => list.map(String)))
refused((all) => { all[2][17] += 1; return all })
refused((all) => { all[5].pop(); return all })
refused((all) => [all[1], ...all.slice(1)])
