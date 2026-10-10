import { strict as assert } from 'node:assert'

// Each input is one HTTP Accept header value as a string. A correct result is
// the list of its acceptable media ranges in order of preference: highest q
// first, ranges with equal q in the order the header lists them, and ranges
// with q=0 ("not acceptable", RFC 9110 section 12.4.2) left out. An entry is a
// string "type/subtype" (parameters after a ";" are allowed and not compared)
// or an object with the type and subtype as fields (type/Type,
// subtype/subType/SubType); other fields are not compared.
//
// The fixtures stay inside what the specification and every package agree on:
// a range with a wildcard always has a lower q than every range more specific
// than it (concrete > type/* > */*), so "q, then specificity, then order"
// and "q, then order" give the same list; equal q only joins ranges of the
// same specificity; at most 12 ranges; parameter values without commas,
// semicolons or equals signs (quoted ones included); single spaces only.

// Concrete ranges, some with parameters (one of them quoted).
const concrete = [
  'text/html', 'application/xhtml+xml', 'application/xml', 'image/avif', 'image/webp', 'image/apng',
  'application/json', 'text/plain', 'application/signed-exchange;v=b3', 'text/html;level=1',
  'text/html;level=2', 'application/vnd.api+json', 'application/ld+json;profile="https://www.w3.org/ns/activitystreams"',
  'text/csv;charset=utf-8;header=present', 'image/png', 'image/svg+xml', 'application/pdf',
  'text/markdown;variant=GFM', 'application/x-www-form-urlencoded', 'audio/ogg;codecs=opus', 'video/mp4',
  'application/vnd.github.v3+json', 'text/event-stream', 'application/cbor',
]
const typeWild = ['text/*', 'image/*', 'application/*', 'audio/*', 'video/*']
// q values with up to three decimals; 0.85 and 0.8, 0.875 and 0.87 sit close
// together so a parser that truncates q gives another order.
const highQ = ['1', '1.0', '0.95', '0.9', '0.875', '0.87', '0.85', '0.8', '0.75', '0.7', '0.6', '0.5']
const lowQ = ['0.45', '0.4', '0.35', '0.3', '0.25', '0.2', '0.15', '0.1', '0.05', '0.01', '0.001']

// Deterministic xorshift32, so fixtures never change.
const rng = (seed) => {
  let x = (seed * 2654435761 + 977) >>> 0 || 1
  return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x }
}
const qNum = (q) => (q === undefined ? 1 : Number(q))

const build = (i) => {
  const next = rng(i + 1)
  const pick = (list) => list[next() % list.length]
  const nConcrete = 2 + (next() % 7) // 2..8
  const nTypeWild = i % 4 === 1 ? 0 : next() % 3 // 0..2
  const withAll = i % 5 !== 2
  // Concrete ranges: a few share q (ties keep header order); some have no q.
  const entries = []
  const used = new Set()
  while (entries.length < nConcrete) {
    const r = pick(concrete)
    if (used.has(r)) continue
    used.add(r)
    const roll = next() % 4
    entries.push({ range: r, q: roll === 0 ? undefined : pick(highQ), group: 0 })
  }
  // Headers without wildcards may mark a concrete range q=0.
  if (nTypeWild === 0 && !withAll && i % 2 === 0) entries[next() % entries.length].q = i % 4 === 0 ? '0' : '0.0'
  const minConcrete = Math.min(...entries.map((e) => qNum(e.q)).filter((q) => q > 0))
  const wild = []
  const usedWild = new Set()
  while (wild.length < nTypeWild) {
    const r = pick(typeWild)
    if (usedWild.has(r)) continue
    usedWild.add(r)
    const candidates = lowQ.filter((q) => Number(q) < minConcrete && Number(q) >= 0.1)
    wild.push({ range: r, q: pick(candidates), group: 1 })
  }
  let all = []
  if (withAll) {
    const floor = Math.min(minConcrete, ...wild.map((e) => qNum(e.q)))
    // Sometimes */*;q=0, which every package must leave out.
    const q = i % 7 === 3 ? '0' : pick(lowQ.filter((v) => Number(v) < floor))
    all = [{ range: '*/*', q, group: 2 }]
  }
  // Interleave: wildcards may come anywhere in the header, not only last.
  const list = [...entries]
  for (const w of [...wild, ...all]) list.splice(i % 3 === 0 ? list.length : next() % (list.length + 1), 0, w)
  assert.ok(list.length <= 12)
  const comma = i % 2 ? ', ' : ','
  const semi = i % 3 === 1 ? '; ' : ';'
  const header = list.map(({ range, q }) => (q === undefined ? range : `${range}${semi}q=${q}`)).join(comma)
  // Expected: stable sort by q descending, q=0 left out.
  const expected = list
    .map((e, order) => ({ ...e, order, qn: qNum(e.q) }))
    .filter((e) => e.qn > 0)
    .sort((a, b) => b.qn - a.qn || a.order - b.order)
    .map((e) => e.range.split(';')[0])
  return { input: header, expected, list }
}

const built = Array.from({ length: 48 }, (_, i) => build(i))
export const cases = built.map(({ input, expected }) => ({ input, expected }))

// The fixtures keep the stated limits.
assert.equal(cases.length, 48)
const groupOf = (r) => (r === '*/*' ? 2 : r.split(';')[0].endsWith('/*') ? 1 : 0)
for (const { list } of built) {
  for (const a of list) for (const b of list) {
    if (groupOf(a.range) < groupOf(b.range)) {
      const qa = qNum(a.q); const qb = qNum(b.q)
      assert.ok(qa > qb || (qa === 0 && qb === 0), `a wildcard must rank below every more specific range: ${a.range} ${b.range}`)
    }
  }
}
// The cases exercise what they claim: reordering, ties, q=0, close q values.
const inHeaderOrder = (i) => built[i].list.filter((e) => qNum(e.q) > 0).map((e) => e.range.split(';')[0])
assert.ok(cases.filter((_, i) => inHeaderOrder(i).join() !== cases[i].expected.join()).length >= 36)
assert.ok(built.filter(({ list }) => list.some((e) => qNum(e.q) === 0)).length >= 6)
assert.ok(built.filter(({ list }) => { const qs = list.map((e) => qNum(e.q)); return new Set(qs).size < qs.length }).length >= 24)

const entryOf = (i, j, e) => {
  if (typeof e === 'string') return e.split(';')[0].trim()
  assert.ok(e && typeof e === 'object', `fixture ${i}, entry ${j}: a string or an object is required`)
  const type = e.type ?? e.Type
  const subtype = e.subtype ?? e.subType ?? e.SubType
  assert.equal(typeof type, 'string', `fixture ${i}, entry ${j}: type must be a string`)
  assert.equal(typeof subtype, 'string', `fixture ${i}, entry ${j}: subtype must be a string`)
  return `${type}/${subtype}`
}
export const verifyOne = (i, output) => {
  const { input, expected } = cases[i]
  assert.ok(Array.isArray(output), `fixture ${i}: a list of media ranges is required`)
  const got = output.map((e, j) => entryOf(i, j, e))
  assert.deepStrictEqual(got, expected, `fixture ${i}: ${JSON.stringify(input)}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// The check accepts every spelling of the right list.
verifyResults(cases.map(({ expected }) => expected))
verifyResults(built.map(({ list }) => list
  .map((e, order) => ({ e, order, q: qNum(e.q) })).filter((x) => x.q > 0)
  .sort((a, b) => b.q - a.q || a.order - b.order).map((x) => x.e.range)))
verifyResults(cases.map(({ expected }) => expected.map((r) => { const [Type, SubType] = r.split('/'); return { Type, SubType, Q: 1, Params: null } })))

// And refuses outputs that did not do the job.
const rangesOf = ({ list }) => list.map((e, order) => ({ r: e.range.split(';')[0], q: qNum(e.q), order }))
const sorted = (xs, cmp) => [...xs].sort(cmp).map((x) => x.r)
const wrong = {
  'the input unchanged': cases.map(({ input }) => input),
  'the ranges in header order': built.map((_, i) => inHeaderOrder(i)),
  'q=0 ranges kept': built.map((b) => sorted(rangesOf(b), (a, c) => c.q - a.q || a.order - c.order)),
  'lowest q first': built.map((b) => sorted(rangesOf(b).filter((x) => x.q > 0), (a, c) => a.q - c.q || a.order - c.order)),
  'ties in reverse header order': built.map((b) => sorted(rangesOf(b).filter((x) => x.q > 0), (a, c) => c.q - a.q || c.order - a.order)),
  'q truncated to one decimal': built.map((b) => sorted(rangesOf(b).filter((x) => x.q > 0), (a, c) => Math.trunc(c.q * 10) - Math.trunc(a.q * 10) || a.order - c.order)),
  'q read as a whole number': built.map((b) => sorted(rangesOf(b).filter((x) => x.q > 0), (a, c) => Math.trunc(c.q) - Math.trunc(a.q) || a.order - c.order)),
  "another fixture's list": cases.map((_, i) => cases[(i + 1) % cases.length].expected),
  'a constant': cases.map(() => ['*/*']),
}
for (const [name, outputs] of Object.entries(wrong)) assert.throws(() => verifyResults(outputs), undefined, `${name} must be refused`)
