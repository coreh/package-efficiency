import { strict as assert } from 'node:assert'

// ---- Fixtures (deterministic) ------------------------------------------------
// A fixture is { counters, gauges, histograms, updates }.
//   counters:   [{ name, help, labels: [labelName, ...] }]
//   gauges:     [{ name, help, labels }]
//   histograms: [{ name, help, labels, buckets: [upperBound, ...] }]  (+Inf is implicit)
//   updates:    [[op, metricIndex, [labelValue, ...], amount], ...]
//     "inc" adds amount (a positive integer) to counters[metricIndex];
//     "set", "add" and "sub" set, raise or lower gauges[metricIndex];
//     "observe" records amount in histograms[metricIndex].
// Amounts are multiples of 1/8, so every sum is exact in binary floating point.
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const labelSets = [
  [],
  ['method'],
  ['method', 'code'],
  ['route'],
  ['region', 'zone', 'tier'],
]
const pools = {
  method: ['GET', 'POST', 'PUT', 'DELETE'],
  code: ['200', '404', '500'],
  route: ['/', '/api/items', 'São Paulo', 'say "hi"\\now', 'a b'],
  region: ['eu', 'us', 'ap'],
  zone: ['a', 'b'],
  tier: ['web', 'db'],
}
const bucketSets = [
  [0.5, 1, 2.5, 5, 10],
  [0.125, 0.25, 0.5, 1, 2, 4, 8],
  [1, 10, 100],
]
const make = (seed, nc, ng, nh, nu) => {
  const r = rng(seed)
  const pick = (list) => list[Math.floor(r() * list.length)]
  const describe = (kind, i, name) => {
    const labels = labelSets[(i + seed) % labelSets.length]
    return { name, help: `Help text for ${kind} ${i}.`, labels }
  }
  const counters = Array.from({ length: nc }, (_, i) => describe('counter', i, `bench_counter_${i}_total`))
  const gauges = Array.from({ length: ng }, (_, i) => describe('gauge', i, `bench_gauge_${i}`))
  const histograms = Array.from({ length: nh }, (_, i) => ({ ...describe('histogram', i, `bench_histogram_${i}_seconds`), buckets: bucketSets[(i + seed) % bucketSets.length] }))
  // Each metric uses up to six label combinations.
  const combos = (m) => {
    const all = []
    const n = 1 + Math.floor(r() * 6)
    for (let k = 0; k < n; k++) all.push(m.labels.map((l) => pick(pools[l])))
    return all
  }
  for (const m of [...counters, ...gauges, ...histograms]) m.combos = combos(m)
  const updates = []
  const ops = []
  if (nc) ops.push('inc')
  if (ng) ops.push('set', 'add', 'sub')
  if (nh) ops.push('observe', 'observe')
  const of = { inc: counters, set: gauges, add: gauges, sub: gauges, observe: histograms }
  // The first updates touch every label combination once, so each series exists.
  const first = []
  const amount = (op) => op === 'inc' ? 1 + Math.floor(r() * 20) : op === 'set' ? Math.floor(r() * 400) / 4 : op === 'observe' ? Math.floor(r() * 100) / 8 : Math.floor(r() * 40) / 4
  for (const [op, list] of [['inc', counters], ['set', gauges], ['observe', histograms]]) {
    list.forEach((m, i) => { for (const lv of m.combos) first.push([op, i, lv, amount(op)]) })
  }
  updates.push(...first)
  while (updates.length < nu) {
    const op = pick(ops)
    const i = Math.floor(r() * of[op].length)
    updates.push([op, i, pick(of[op][i].combos), amount(op)])
  }
  for (const m of [...counters, ...gauges, ...histograms]) delete m.combos
  return { counters, gauges, histograms, updates }
}
const shapes = [
  [1, 1, 1, 30],
  [3, 2, 2, 150],
  [6, 4, 4, 400],
  [10, 8, 8, 1000],
  [2, 2, 2, 2000],
  [4, 3, 3, 600],
  [12, 10, 10, 1500],
  [5, 0, 5, 300],
]
export const cases = shapes.map(([nc, ng, nh, nu], i) => ({ input: make(101 + i * 7, nc, ng, nh, nu) }))

// ---- Expected samples, computed from the fixture alone -----------------------
const key = (name, labels) => name + '{' + Object.keys(labels).sort().map((k) => `${k}=${JSON.stringify(labels[k])}`).join(',') + '}'
const num = (x) => (x === Infinity ? '+Inf' : String(x))
export const expected = (fixture) => {
  const samples = new Map()
  const families = new Map() // family name -> { type, help }
  const labelsOf = (m, values) => Object.fromEntries(m.labels.map((l, i) => [l, values[i]]))
  const counters = fixture.counters.map(() => new Map())
  const gauges = fixture.gauges.map(() => new Map())
  const hists = fixture.histograms.map(() => new Map())
  for (const [op, i, lv, v] of fixture.updates) {
    const id = JSON.stringify(lv)
    if (op === 'inc') counters[i].set(id, (counters[i].get(id) ?? 0) + v)
    else if (op === 'set') gauges[i].set(id, v)
    else if (op === 'add') gauges[i].set(id, (gauges[i].get(id) ?? 0) + v)
    else if (op === 'sub') gauges[i].set(id, (gauges[i].get(id) ?? 0) - v)
    else if (op === 'observe') {
      const h = hists[i].get(id) ?? { buckets: fixture.histograms[i].buckets.map(() => 0), inf: 0, sum: 0 }
      fixture.histograms[i].buckets.forEach((b, k) => { if (v <= b) h.buckets[k]++ })
      h.inf++
      h.sum += v
      hists[i].set(id, h)
    } else throw new Error('unknown op ' + op)
  }
  fixture.counters.forEach((m, i) => {
    families.set(m.name.replace(/_total$/, ''), { type: 'counter', help: m.help })
    for (const [id, v] of counters[i]) samples.set(key(m.name, labelsOf(m, JSON.parse(id))), v)
  })
  fixture.gauges.forEach((m, i) => {
    families.set(m.name, { type: 'gauge', help: m.help })
    for (const [id, v] of gauges[i]) samples.set(key(m.name, labelsOf(m, JSON.parse(id))), v)
  })
  fixture.histograms.forEach((m, i) => {
    families.set(m.name, { type: 'histogram', help: m.help })
    for (const [id, h] of hists[i]) {
      const base = labelsOf(m, JSON.parse(id))
      m.buckets.forEach((b, k) => samples.set(key(m.name + '_bucket', { ...base, le: num(b) }), h.buckets[k]))
      samples.set(key(m.name + '_bucket', { ...base, le: '+Inf' }), h.inf)
      samples.set(key(m.name + '_count', base), h.inf)
      samples.set(key(m.name + '_sum', base), h.sum)
    }
  })
  return { samples, families }
}

// ---- A strict reader of the Prometheus text exposition format ----------------
const unescape = (s, what) => s.replace(/\\(.)/gs, (_, c) => {
  if (c === '\\') return '\\'
  if (c === 'n') return '\n'
  if (c === '"' && what === 'label') return '"'
  throw new Error(`bad escape \\${c} in ${what}`)
})
const parseValue = (s) => {
  if (s === '+Inf' || s === 'Inf') return Infinity
  if (s === '-Inf') return -Infinity
  if (s === 'NaN') return NaN
  assert.match(s, /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/, `bad number ${s}`)
  return Number(s)
}
export const readExposition = (text) => {
  assert.equal(typeof text, 'string', 'the output must be text')
  const samples = new Map()
  const types = new Map()
  const helps = new Map()
  const ignorable = new Set()
  for (const line of text.split('\n')) {
    if (line === '') continue
    let m
    if ((m = /^# HELP ([a-zA-Z_:][a-zA-Z0-9_:]*)(?: (.*))?$/.exec(line))) {
      assert.ok(!helps.has(m[1]), `HELP twice for ${m[1]}`)
      helps.set(m[1], unescape(m[2] ?? '', 'help'))
    } else if ((m = /^# TYPE ([a-zA-Z_:][a-zA-Z0-9_:]*) (counter|gauge|histogram|summary|untyped)$/.exec(line))) {
      assert.ok(!types.has(m[1]), `TYPE twice for ${m[1]}`)
      types.set(m[1], m[2])
    } else if (line.startsWith('#')) {
      assert.fail(`unexpected comment line: ${line}`)
    } else {
      m = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(.*)\})? (\S+)(?: -?\d+)?$/.exec(line)
      assert.ok(m, `not a sample line: ${line}`)
      const labels = {}
      let rest = m[2] ?? ''
      while (rest !== '') {
        const l = /^([a-zA-Z_][a-zA-Z0-9_]*)="((?:[^"\\]|\\.)*)"(?:,|$)/s.exec(rest)
        assert.ok(l, `bad labels in: ${line}`)
        assert.ok(!(l[1] in labels), `label ${l[1]} twice in: ${line}`)
        labels[l[1]] = unescape(l[2], 'label')
        rest = rest.slice(l[0].length)
      }
      if ('le' in labels) labels.le = num(parseValue(labels.le))
      const id = key(m[1], labels)
      assert.ok(!samples.has(id), `sample twice: ${id}`)
      samples.set(id, parseValue(m[3]))
    }
  }
  return { samples, types, helps, ignorable }
}

// _created series (Python's client writes the creation time of each series, with
// their own TYPE and HELP lines) are a clock reading, not a metric value; they are
// dropped before comparing.
const isCreated = (id) => /^[a-zA-Z0-9_:]+_created\{/.test(id)

export const verifyOne = (i, text) => {
  const want = expected(cases[i].input)
  const got = readExposition(text)
  const samples = new Map([...got.samples].filter(([id]) => !isCreated(id)))
  // Families: TYPE and HELP for each registered metric, and no others. A counter's
  // family may be written with or without the _total suffix.
  const family = (name) => name.replace(/_total$/, '')
  const gotTypes = new Map([...got.types].filter(([n]) => !n.endsWith('_created')).map(([n, t]) => [family(n), t]))
  const gotHelps = new Map([...got.helps].filter(([n]) => !n.endsWith('_created')).map(([n, t]) => [family(n), t]))
  for (const [name, { type, help }] of want.families) {
    assert.equal(gotTypes.get(family(name)), type, `fixture ${i}: TYPE of ${name}`)
    assert.equal(gotHelps.get(family(name)), help, `fixture ${i}: HELP of ${name}`)
  }
  assert.equal(gotTypes.size, want.families.size, `fixture ${i}: unexpected metric families ${[...gotTypes.keys()].filter((n) => !want.families.has(n))}`)
  const missing = [...want.samples.keys()].filter((id) => !samples.has(id))
  const extra = [...samples.keys()].filter((id) => !want.samples.has(id))
  assert.deepEqual({ missing: missing.slice(0, 3), extra: extra.slice(0, 3) }, { missing: [], extra: [] }, `fixture ${i}: samples differ`)
  for (const [id, v] of want.samples) {
    const g = samples.get(id)
    assert.ok(Math.abs(g - v) <= 1e-9 * Math.max(1, Math.abs(v)), `fixture ${i}: ${id} is ${g}, expected ${v}`)
  }
}

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  outputs.forEach((text, i) => verifyOne(i, text))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (text) => text.length

// ---- Proof that the check can fail --------------------------------------------
// A reference rendering of the expected samples passes; damaged ones do not.
{
  const render = (i, edit = (lines) => lines) => {
    const { samples, families } = expected(cases[i].input)
    const lines = []
    for (const [name, { type, help }] of families) lines.push(`# HELP ${name} ${help}`, `# TYPE ${name} ${type}`)
    for (const [id, v] of samples) lines.push(id.replace(/=("(?:[^"\\]|\\.)*")/g, (_, q) => '=' + q) + ' ' + v)
    return edit(lines).join('\n') + '\n'
  }
  // key() writes labels as JSON strings, which is valid exposition escaping for these values.
  const bad = [
    (l) => l.filter((x) => !x.startsWith('# TYPE')),
    (l) => l.filter((x) => !x.includes('_bucket')),
    (l) => l.filter((x) => !x.includes('_sum')),
    (l) => l.map((x, k) => (k === l.length - 1 ? x.replace(/ [^ ]+$/, ' 12345.5') : x)),
    (l) => l.slice(0, l.length - 1),
    () => [],
  ]
  verifyOne(1, render(1))
  verifyOne(3, render(3))
  for (const edit of bad) assert.throws(() => verifyOne(3, render(3, edit)), undefined, 'a damaged rendering must fail')
}
