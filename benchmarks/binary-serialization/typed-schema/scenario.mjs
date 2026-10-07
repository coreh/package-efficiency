import { strict as assert } from 'node:assert'
const words = ['alpha', 'βeta', 'gamma', 'δelta', 'café', '日本語のテキスト', 'São Paulo', 'naïve 😀 emoji', 'x']
const r3 = (x) => Math.round(x * 1000) / 1000
const long = (n, i) => Array.from({ length: n }, (_, k) => words[(i + k) % words.length]).join(' ')
// The schema: field names, in order. Anything else on an input is unknown and must not survive.
const record = (i) => ({
  id: i * 7919 - 100000,
  name: `Sensor ${i} ${words[i % words.length]}`,
  active: i % 3 !== 0,
  score: r3(i / 7 + 0.5),
  tags: Array.from({ length: i % 7 }, (_, k) => words[(i + k) % words.length]),
  samples: Array.from({ length: 4 + (i % 9) * 6 }, (_, k) => ((i + 3) * (k + 1) * 104729) % 2000003 - 1000000),
  readings: Array.from({ length: 2 + (i % 5) * 4 }, (_, k) => r3(-50 + k * 3.125 + i / 9)),
  location: { lat: r3(-23.55 - i / 100), lon: r3(-46.63 + i / 100), city: i % 2 ? 'São Paulo' : 'Zürich' },
  events: Array.from({ length: i % 6 }, (_, j) => ({ at: 1700000000 + i * 3600 + j * 17, kind: ['boot', 'reading', 'fault'][j % 3], value: r3(j * 9.99 + 0.5) })),
  trace: { debug: true, notes: long(1 + (i % 4), i) }, // not in the schema
})
export const cases = Array.from({ length: 40 }, (_, i) => ({ input: record(i) }))
cases.push(
  { input: { ...record(40), name: '', active: false, score: 0, tags: [], samples: [], readings: [], events: [], location: { lat: 0, lon: 0, city: '' } } },
  { input: { ...record(41), samples: Array.from({ length: 600 }, (_, i) => i * i - 90000), readings: Array.from({ length: 200 }, (_, i) => r3(i / 8 - 7.5)) } },
  { input: { ...record(42), id: -2147483648, samples: [-2147483648, 2147483647, 0, -1, 1, 127, 128, 16383, 16384], score: 1e-7 } },
  { input: { ...record(43), name: long(80, 2), tags: Array.from({ length: 40 }, (_, i) => 'tag-' + i + 'é') } },
  { input: { ...record(44), events: Array.from({ length: 60 }, (_, j) => ({ at: 2000000000 - j, kind: ['boot', 'reading', 'fault'][j % 3], value: r3(j * 1.5) })) } },
  { input: { ...record(45), id: 2147483647, score: 123456789.125, readings: [1e10, -1e-10, 0.1, 2 ** 40] } },
  { input: { ...record(46), name: 'z'.repeat(5000) } },
  { input: { ...record(47), tags: ['', '', 'a'], events: [{ at: 0, kind: '', value: 0 }] } },
)
const num = (x) => (typeof x === 'number' ? x : Number(x))
const readEvent = (e) => ({ at: num(e.at), kind: e.kind, value: num(e.value) })
// Reads the schema's fields only. A protobuf decoder may leave defaults (empty
// string, zero, empty list) on the prototype, so every field is read by name.
const project = (r) => {
  const loc = r.location
  return {
    id: num(r.id), name: r.name, active: r.active, score: num(r.score),
    tags: Array.from(r.tags), samples: Array.from(r.samples, num), readings: Array.from(r.readings, num),
    location: { lat: num(loc.lat), lon: num(loc.lon), city: loc.city },
    events: Array.from(r.events, readEvent),
  }
}
const checkDecoded = (decoded) => {
  assert.ok(Array.isArray(decoded), 'outputs must be an array')
  assert.equal(decoded.length, cases.length, 'one output per fixture is required')
  for (const [i, { input }] of cases.entries()) {
    const expected = project(input)
    assert.deepStrictEqual(project(decoded[i]), expected, `fixture ${i}`)
    // Fields outside the schema must be gone: the work happened, the input was not handed back.
    assert.ok(!('trace' in decoded[i]) || decoded[i].trace === undefined, `fixture ${i}: unknown field survived`)
  }
}
// Native adapters: { decoded, encodedBytes } where decoded lists exactly the schema's fields
// and encodedBytes is the length of the encoded buffer from a second, untimed encode.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  for (const [i, output] of outputs.entries()) {
    assert.ok(output !== null && typeof output === 'object' && 'decoded' in output, `fixture ${i}: { decoded, encodedBytes } required`)
    assert.ok(Number.isInteger(output.encodedBytes) && output.encodedBytes > 0, `fixture ${i}: the encoder must produce a non-empty byte buffer`)
    assert.deepStrictEqual(Object.keys(output.decoded).sort(), ['active', 'events', 'id', 'location', 'name', 'readings', 'samples', 'score', 'tags'], `fixture ${i}: schema fields only`)
  }
  checkDecoded(outputs.map((output) => output.decoded))
}
export const verify = (operation) => checkDecoded(cases.map(({ input }, i) => {
  const output = operation(input)
  assert.notStrictEqual(output, input, `fixture ${i}: the input itself was returned`)
  return output
}))
export const consume = (value) => value.samples.length
