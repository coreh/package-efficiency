import { strict as assert } from 'node:assert'
// Input: { entries, ops, keep, lookups }.
//   entries  a JSON object of string keys to integer values: version 0 of the map, built in one step
//            with the library's from-mapping constructor (or, where it has none, one insert per entry).
//   ops      applied in order, each to the version the previous op produced, each making a new version:
//              ["set", key, value]   add the key, or replace its value
//              ["delete", key]       remove the key (it is always present when the op runs)
//   keep     the version numbers to keep: [0, half, ops.length]. Version k is the map after k ops.
//   lookups  keys to read in every kept version, some present, some deleted, some never present.
// After the last op, the result is one [size, values] per kept version, in the order of keep: the
// number of keys in that version and the value of each lookup key in it, null where it is absent.
// Version 0 must still hold its original contents, so a map that is changed in place fails.

// Deterministic generator (LCG), so fixtures never change between runs.
let seed = 20261011
const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0)
const range = (n) => Math.floor((next() / 4294967296) * n)
const pick = (list) => list[range(list.length)]
const shuffle = (list) => {
  for (let j = list.length - 1; j > 0; j--) { const r = range(j + 1); [list[j], list[r]] = [list[r], list[j]] }
  return list
}

// Key styles: zero-padded record ids, words of varied length, paths sharing long prefixes, and a few
// keys with non-ASCII letters.
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
const word = (min, max) => Array.from({ length: min + range(max - min + 1) }, () => alphabet[range(alphabet.length)]).join('')
const styles = [
  () => `user:${String(range(1_000_000)).padStart(7, '0')}`,
  () => word(1, 24),
  () => `/srv/app/${pick(['config', 'cache', 'logs'])}/${word(2, 6)}/${word(1, 10)}`,
  () => `${pick(['café', 'größe', 'ключ', 'naïve', 'item'])}-${word(1, 8)}`,
]
const freshKey = (style, used) => {
  for (;;) {
    const k = style()
    if (!used.has(k)) { used.add(k); return k }
  }
}
// Values: distinct enough that every change is visible; about one in twenty is 0.
const value = () => (range(20) === 0 ? 0 : range(1_000_000))

const build = (i, n, count) => {
  const style = styles[i % styles.length]
  const used = new Set()
  const initial = Array.from({ length: n }, () => freshKey(style, used))
  const entries = {}
  for (const k of initial) entries[k] = value()
  const present = new Set(initial)
  const deleted = new Set()
  const inserted = new Set()
  const ops = []
  while (ops.length < count) {
    const r = range(100)
    if (present.size > 0 && r < 25) {
      // delete a present key
      const k = pick([...present])
      present.delete(k); deleted.add(k)
      ops.push(['delete', k])
    } else if (present.size > 0 && r < 75) {
      // replace the value of a present key
      ops.push(['set', pick([...present]), value()])
    } else {
      // add a key: a brand-new one, or one deleted earlier
      const k = deleted.size > 0 && range(3) === 0 ? pick([...deleted]) : freshKey(style, used)
      deleted.delete(k); present.add(k); inserted.add(k)
      ops.push(['set', k, value()])
    }
  }
  const absent = Array.from({ length: 10 }, () => freshKey(style, used))
  const sample = (set, m) => shuffle([...set]).slice(0, m)
  const lookups = shuffle([...new Set([...sample(initial, 20), ...sample(inserted, 15), ...sample(deleted, 15), ...absent])])
  return { entries, ops, keep: [0, Math.floor(count / 2), count], lookups }
}

// Reference: plain Map copies, one per version.
const apply = ({ entries, ops, keep, lookups }) => {
  const versions = [new Map(Object.entries(entries))]
  for (const [kind, k, v] of ops) {
    const m = new Map(versions.at(-1))
    if (kind === 'set') m.set(k, v)
    else m.delete(k)
    versions.push(m)
  }
  return keep.map((n) => [versions[n].size, lookups.map((k) => (versions[n].has(k) ? versions[n].get(k) : null))])
}

export const cases = Array.from({ length: 40 }, (_, i) => {
  const input = build(i, 200 + (i * 137) % 801, 100 + (i % 5) * 100)
  return { input, expected: apply(input) }
})
// Hand-made edge cases: an empty start built entirely by sets; a map emptied by the middle version and
// refilled, with a key deleted and set again.
const edge = (input) => ({ input, expected: apply(input) })
cases[38] = edge({
  entries: {},
  ops: [['set', 'a', 1], ['set', 'b', 0], ['set', 'a', 2], ['delete', 'b'], ['set', 'c', 3], ['set', 'b', 4], ['delete', 'a'], ['set', 'd', 5]],
  keep: [0, 4, 8],
  lookups: ['a', 'b', 'c', 'd', 'e'],
})
cases[39] = edge({
  entries: { x: 10, y: 0, 'z/z': 30 },
  ops: [['delete', 'y'], ['set', 'x', 11], ['delete', 'x'], ['delete', 'z/z'], ['set', 'y', 7], ['set', 'x', 0], ['set', 'y', 8], ['delete', 'x']],
  keep: [0, 4, 8],
  lookups: ['x', 'y', 'z/z', 'w'],
})

export const verifyOne = (i, out) => {
  assert.ok(Array.isArray(out), `fixture ${i}: a list of [size, values] per kept version is required`)
  assert.equal(out.length, cases[i].expected.length, `fixture ${i}: one entry per kept version is required`)
  for (const [j, n] of cases[i].input.keep.entries()) {
    assert.deepStrictEqual(out[j], cases[i].expected[j], `fixture ${i}: version ${n}`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result[2][0] + result[2][1].length

// Wrong outputs are refused: a map changed in place (every kept version reads as the last one), the
// middle and last versions swapped, deletes ignored, a missing key read as 0 or undefined instead of
// null, a size off by one, another fixture's answer.
const ignoringDeletes = (input) => apply({ ...input, ops: input.ops.filter(([kind]) => kind === 'set') })
let zeros = 0
for (const [i, { input, expected }] of cases.entries()) {
  const [v0, mid, end] = expected
  assert.throws(() => verifyOne(i, [end, end, end]), `fixture ${i}: an in-place map must fail`)
  assert.throws(() => verifyOne(i, [v0, end, mid]))
  assert.throws(() => verifyOne(i, ignoringDeletes(input)))
  assert.throws(() => verifyOne(i, [v0, mid, [end[0] + 1, end[1]]]))
  assert.throws(() => verifyOne(i, [v0, mid, [end[0], end[1].map((x) => x ?? 0)]]))
  assert.throws(() => verifyOne(i, [v0, mid, [end[0], end[1].map((x) => x ?? undefined)]]))
  assert.throws(() => verifyOne(i, cases[(i + 1) % cases.length].expected))
  if (expected.some(([, values]) => values.includes(0))) zeros++
  verifyOne(i, JSON.parse(JSON.stringify(expected)))
}
assert.ok(zeros >= 10, 'the fixtures must read the value 0 often enough to catch a falsy check')
assert.ok(cases.every(({ expected: [v0, mid] }) => JSON.stringify(v0) !== JSON.stringify(mid)), 'version 0 must differ from the middle version')
