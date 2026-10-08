import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Each input is an XML property list, written the way Apple's tools write one:
// a DOCTYPE, tab indentation, `<dict/>` and `<array/>` for empty containers,
// data as base64 wrapped over several lines. The generator keeps the value it
// wrote: dictionaries are plain objects, dates are Date objects, data are
// Uint8Arrays, integers are whole numbers and reals always have a fraction.
const words = ['Widget', 'Bolt & Nut', 'Tea <green>', 'Cable 3" x 2\'', 'Café crème', '日本語のラベル', 'a > b', 'Tom & "Jerry"', 'plain', 'Ünïcödé ✓', 'two  inner  spaces', 'x&amp;y']
const pick = (pool, i, k = 0) => pool[(i * 7 + k * 3) % pool.length]
// A deterministic byte generator (a linear congruential sequence).
const bytes = (seed, length) => {
  let s = (seed * 2654435761 + 12345) >>> 0
  return Uint8Array.from({ length }, () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0), s >>> 24))
}
const date = (n) => new Date(Date.UTC(2020 + (n % 7), n % 12, 1 + (n % 28), n % 24, (n * 7) % 60, (n * 13) % 60))
const ints = [0, 1, -1, 42, -273, 65536, 2147483647, -2147483648, 4294967296, -9007199254740, 123456789012]
const reals = [0.5, -0.25, 3.14159, 1234.5678, -0.001, 2.718281828, 100.125, 0.1]
const entry = (seed, i) => {
  const n = seed * 31 + i
  return {
    Name: pick(words, n),
    Identifier: `com.example.item${n}`,
    Count: pick(ints, n, 1),
    Ratio: pick(reals, n, 2),
    Enabled: n % 3 !== 0,
    Hidden: n % 5 === 0,
    Added: date(n),
    Thumbnail: bytes(n, 8 + (n * 11) % 90),
    Tags: Array.from({ length: n % 4 }, (_, k) => pick(words, n, k + 3)),
    Meta: {
      Owner: pick(words, n, 5),
      Note: n % 4 === 1 ? '' : pick(words, n, 6),
      Level: pick(ints, n, 7),
      Scores: [pick(reals, n, 8), pick(reals, n, 9), pick(ints, n, 10)],
      Empty: n % 2 ? [] : {},
    },
  }
}
const sizes = [1, 2, 3, 4, 6, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40, 45, 5, 7, 9, 14, 22, 28, 50, 60]
const document = (s) => ({
  CFBundleName: pick(words, s),
  CFBundleVersion: `1.${s}.0`,
  CFBundleSignature: '????',
  Created: date(s * 3),
  Enabled: true,
  Beta: false,
  Build: 1000 + s,
  Scale: pick(reals, s),
  Icon: bytes(s + 500, 200 + s * 17),
  Items: Array.from({ length: sizes[s % sizes.length] }, (_, i) => entry(s, i)),
})

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const base64Lines = (data, indent) => {
  const text = Buffer.from(data).toString('base64')
  const lines = text.match(/.{1,68}/g) ?? []
  return lines.map((line) => indent + line).join('\n')
}
const write = (value, depth) => {
  const pad = '\t'.repeat(depth)
  if (typeof value === 'string') return `${pad}<string>${escape(value)}</string>`
  if (typeof value === 'boolean') return `${pad}<${value}/>`
  if (typeof value === 'number') return Number.isInteger(value) ? `${pad}<integer>${value}</integer>` : `${pad}<real>${value}</real>`
  if (value instanceof Date) return `${pad}<date>${value.toISOString().replace('.000Z', 'Z')}</date>`
  if (value instanceof Uint8Array) return `${pad}<data>\n${base64Lines(value, pad)}\n${pad}</data>`
  if (Array.isArray(value)) return value.length ? `${pad}<array>\n${value.map((v) => write(v, depth + 1)).join('\n')}\n${pad}</array>` : `${pad}<array/>`
  const keys = Object.keys(value)
  if (!keys.length) return `${pad}<dict/>`
  return `${pad}<dict>\n${keys.map((k) => `${pad}\t<key>${escape(k)}</key>\n${write(value[k], depth + 1)}`).join('\n')}\n${pad}</dict>`
}
const toPlist = (value) => `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n${write(value, 0)}\n</plist>\n`

const values = Array.from({ length: 24 }, (_, s) => document(s))
export const cases = values.map((value) => ({ input: toPlist(value) }))

// The common shape. The libraries return their own types for a date and for
// data, and Python, Ruby and Go results cross to the verifier as JSON, where
// an adapter's `describe` (or Go's marshalling) writes a date as
// { "$date": ISO 8601 text with a time zone } and data as { "$data": base64 }.
// This reduces every output, whichever way it came, to: plain objects, arrays,
// strings, numbers, booleans, { $date: epoch seconds } and { $data: hex }.
// Integer and real are not told apart (JavaScript cannot), but a number that
// came back as text is wrong.
const strictBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
const normalize = (v, path = '$') => {
  if (typeof v === 'string' || typeof v === 'boolean') return v
  if (typeof v === 'number') { assert.ok(Number.isFinite(v), `${path}: not finite`); return v }
  if (v instanceof Date) { assert.ok(!Number.isNaN(v.getTime()), `${path}: invalid date`); return { $date: v.getTime() / 1000 } }
  if (ArrayBuffer.isView(v)) return { $data: Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString('hex') }
  if (v instanceof ArrayBuffer) return { $data: Buffer.from(v).toString('hex') }
  if (Array.isArray(v)) return v.map((x, i) => normalize(x, `${path}[${i}]`))
  assert.ok(v !== null && typeof v === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(v)), `${path}: unexpected ${v === null ? 'null' : typeof v}`)
  const keys = Object.keys(v)
  if (keys.length === 1 && keys[0] === '$date') {
    const text = v.$date
    assert.ok(typeof text === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(Z|[+-]\d\d:\d\d)$/.test(text), `${path}: date text with a time zone expected, got ${JSON.stringify(text)}`)
    return { $date: Date.parse(text) / 1000 }
  }
  if (keys.length === 1 && keys[0] === '$data') {
    assert.ok(typeof v.$data === 'string' && strictBase64.test(v.$data), `${path}: base64 expected`)
    return { $data: Buffer.from(v.$data, 'base64').toString('hex') }
  }
  return Object.fromEntries(keys.map((k) => [k, normalize(v[k], `${path}.${k}`)]))
}
const expected = values.map((v) => normalize(v))

// The place of the first difference, so a failing library is easy to read.
const find = (a, b, path = '$') => {
  if (a === b) return null
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return `${path}: ${a.length} elements, expected ${b.length}`
    for (let i = 0; i < a.length; i++) { const d = find(a[i], b[i], `${path}[${i}]`); if (d) return d }
    return null
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a)) return `${path}.${k}: missing`
      if (!(k in b)) return `${path}.${k}: unexpected key`
      const d = find(a[k], b[k], `${path}.${k}`); if (d) return d
    }
    return null
  }
  return `${path}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`
}
export const verifyOne = (i, output) => {
  if (typeof output === 'string') output = JSON.parse(output)
  const diff = find(normalize(output), expected[i])
  assert.ok(!diff, `fixture ${i}: ${diff}`)
}
// The check must fail for a parse that did not do the job.
{
  const good = values[0]
  const broken = [
    { ...good, Created: good.Created.toISOString() },
    { ...good, Icon: Buffer.from(good.Icon).toString('base64') },
    { ...good, Build: String(good.Build) },
    { ...good, Items: good.Items.slice(1) },
    { ...good, Enabled: 'true' },
    { ...good, Created: new Date(good.Created.getTime() + 3600000) },
  ]
  for (const wrong of broken) assert.throws(() => verifyOne(0, wrong), undefined, 'a wrong parse must fail the check')
  assert.throws(() => verifyOne(0, cases[0].input), undefined, 'the input text must fail the check')
  assert.doesNotThrow(() => verifyOne(0, good))
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => Object.keys(value).length
