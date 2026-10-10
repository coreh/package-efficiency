import { strict as assert } from 'node:assert'

// Deterministic generator (LCG), so fixtures never change between runs.
let seed = 20261109
const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0)
// The high bits: an LCG's low bits repeat with a short period.
const range = (n) => Math.floor((next() / 2 ** 32) * n)
const hex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[range(16)]).join('')
const pick = (list) => list[range(list.length)]

const PAIRS = 10_000
const READS = 500
const REMOVES = 100

// Key styles: header-like names (some differing from another key only in
// case), query parameters, tags with a few non-ASCII letters, and hex ids.
const words = ['accept', 'cache', 'content', 'cookie', 'forwarded', 'link', 'set', 'trace', 'vary', 'via', 'warning', 'x', 'user', 'tag', 'filter', 'sort', 'page', 'lang']
const accents = ['é', 'ü', 'ñ', 'ø', 'ç', 'ä']
const styles = [
  (j) => `${pick(words)}-${pick(words)}-${j}`,
  (j) => `${pick(words)}[${j}]`,
  (j) => `${pick(words)}${pick(accents)}${j}`,
  () => hex(12),
]
// Distinct keys per fixture, and whether a few keys take most of the values.
const shapes = [
  { keys: 200, skew: false }, { keys: 200, skew: true },
  { keys: 1000, skew: false }, { keys: 1000, skew: true },
  { keys: 3000, skew: false }, { keys: 3000, skew: true },
  { keys: 8000, skew: false }, { keys: 600, skew: true },
]

const distinct = (n, avoid) => {
  const out = [], seen = new Set(avoid)
  for (let j = 0; out.length < n; j++) {
    const k = styles[(j + range(4)) % styles.length](j)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(k)
  }
  return out
}
// A key that differs from k only in case, or a new key, never in `present`.
const absentKey = (present, k) => {
  const upper = k.charAt(0).toUpperCase() + k.slice(1)
  if (upper !== k && !present.has(upper)) return upper
  let a
  do { a = `missing-${hex(8)}` } while (present.has(a))
  return a
}

export const cases = shapes.map(({ keys: count, skew }) => {
  const pool = distinct(count, [])
  // Every distinct key gets at least one value; the rest go uniformly, or to
  // the first keys with a falling (Zipf-like) weight.
  const keyAt = []
  for (const k of pool) keyAt.push(k)
  while (keyAt.length < PAIRS) {
    if (skew) {
      const r = range(1 << 20) / (1 << 20)
      keyAt.push(pool[Math.floor(count * r * r * r)])
    } else keyAt.push(pick(pool))
  }
  for (let j = keyAt.length - 1; j > 0; j--) { const r = range(j + 1); [keyAt[j], keyAt[r]] = [keyAt[r], keyAt[j]] }
  // Values are short tokens from a small pool, and a key's value repeats its
  // previous one a quarter of the time, so keys often hold the same value
  // twice (both are kept, in order).
  const tokens = Array.from({ length: 400 }, (_, j) => `${hex(3)}${j % 10}`)
  const last = new Map()
  const values = keyAt.map((k) => {
    const v = last.has(k) && range(4) === 0 ? last.get(k) : pick(tokens)
    last.set(k, v)
    return v
  })
  const present = new Set(pool)
  // Removals: 90 distinct present keys, one of them twice, and 9 absent keys.
  const shuffled = pool.slice()
  for (let j = shuffled.length - 1; j > 0; j--) { const r = range(j + 1); [shuffled[j], shuffled[r]] = [shuffled[r], shuffled[j]] }
  const removedKeys = shuffled.slice(0, 90)
  const kept = shuffled.slice(90)
  const remove = [...removedKeys, removedKeys[3]]
  while (remove.length < REMOVES) remove.push(absentKey(present, pick(pool)))
  for (let j = remove.length - 1; j > 0; j--) { const r = range(j + 1); [remove[j], remove[r]] = [remove[r], remove[j]] }
  // Reads: 300 kept keys (the kept key with the most values among them), 100
  // removed keys, 100 keys never inserted (most of them a present key in
  // another case).
  const counts = new Map()
  for (const k of keyAt) counts.set(k, (counts.get(k) ?? 0) + 1)
  const busiest = [...counts].filter(([k]) => !removedKeys.includes(k)).sort((x, y) => y[1] - x[1])[0][0]
  const read = [busiest]
  while (read.length < 300) read.push(pick(kept))
  while (read.length < 400) read.push(pick(removedKeys))
  while (read.length < READS) read.push(absentKey(present, pick(pool)))
  for (let j = read.length - 1; j > 0; j--) { const r = range(j + 1); [read[j], read[r]] = [read[r], read[j]] }
  return { input: { keys: keyAt, values, remove, read } }
})

// Reference: a plain Map from key to array, written out.
const reference = ({ keys, values, remove, read }) => {
  const map = new Map()
  keys.forEach((k, i) => {
    const list = map.get(k)
    if (list) list.push(values[i])
    else map.set(k, [values[i]])
  })
  for (const k of remove) map.delete(k)
  return read.map((k) => map.get(k)?.slice() ?? [])
}
for (const c of cases) c.expected = reference(c.input)

export const verifyOne = (i, out) => {
  assert.ok(Array.isArray(out), `fixture ${i}: a list of ${READS} lists is required`)
  assert.equal(out.length, READS, `fixture ${i}: ${READS} lists are required, one per read key`)
  const { expected, input } = cases[i]
  for (let j = 0; j < READS; j++) {
    const list = out[j]
    assert.ok(Array.isArray(list), `fixture ${i}: read ${j} (${JSON.stringify(input.read[j])}) must be a list (an empty one for a missing key)`)
    assert.ok(list.every((v) => typeof v === 'string'), `fixture ${i}: read ${j} must hold strings`)
    assert.deepStrictEqual(list, expected[j], `fixture ${i}: read ${j} (${JSON.stringify(input.read[j])})`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length

// Wrong outputs are refused: removals not done, values sorted or reversed,
// repeated values collapsed, only the first or last value of each key, keys
// compared without case, null for a missing key, another fixture's answer.
for (const [i, { input, expected }] of cases.entries()) {
  verifyOne(i, expected.map((l) => l.slice()))
  const all = new Map()
  input.keys.forEach((k, j) => { if (!all.has(k)) all.set(k, []); all.get(k).push(input.values[j]) })
  const noRemove = input.read.map((k) => all.get(k) ?? [])
  assert.throws(() => verifyOne(i, noRemove), undefined, `fixture ${i}: skipped removals must be refused`)
  assert.throws(() => verifyOne(i, expected.map((l) => l.slice().sort())))
  assert.throws(() => verifyOne(i, expected.map((l) => l.slice().reverse())))
  assert.throws(() => verifyOne(i, expected.map((l) => [...new Set(l)])), undefined, `fixture ${i}: collapsed repeats must be refused`)
  assert.throws(() => verifyOne(i, expected.map((l) => l.slice(0, 1))))
  assert.throws(() => verifyOne(i, expected.map((l) => l.slice(-1))))
  assert.throws(() => verifyOne(i, expected.map((l) => (l.length === 0 ? null : l))))
  assert.throws(() => verifyOne(i, cases[(i + 1) % cases.length].expected))
  // Case-insensitive keys: fold every key and read again.
  const folded = new Map()
  input.keys.forEach((k, j) => { const f = k.toLowerCase(); if (!folded.has(f)) folded.set(f, []); folded.get(f).push(input.values[j]) })
  for (const k of input.remove) folded.delete(k.toLowerCase())
  assert.throws(() => verifyOne(i, input.read.map((k) => folded.get(k.toLowerCase()) ?? [])), undefined, `fixture ${i}: case-folded keys must be refused`)
  assert.ok(expected.some((l) => l.length === 0) && expected.some((l) => l.length >= 5), `fixture ${i} must read missing keys and a key with several values`)
}
