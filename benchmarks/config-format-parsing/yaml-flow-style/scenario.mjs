import { strict as assert } from 'node:assert'

// --- Source data ------------------------------------------------------------
// Fixtures are written from this data by the emitter below, so the expected
// value of every fixture is the data itself, not a parser's reading of text.

const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo', 'naïve 😀']
const awkward = [
  'line\nbreak', 'say "hi"', 'back\\slash', 'tab\there', "it's fine", 'Tom & Jerry <b>',
  'true', 'null', 'yes', 'off', '~', '8080', '0755', '1e3', '3.14', '2026-10-06', '12:30:45',
  'key: value', 'trailing colon:', '#hashtag', 'not # a comment', '- dash', '*star', '&anchor', '!tag',
  '@scope/pkg', '[bracketed]', '{braced}', '{{ template }}', '100%', '| pipe', '> quote', ' padded ', 'a, b', 'x]y', 'p}q',
]
const colors = ['red', 'green', 'blue', 'black', 'white', 'sky blue', 'off white']

const item = (i, j) => ({
  id: 1000 * i + j,
  name: `item-${i}-${j}`,
  sku: `SKU-${String(i).padStart(3, '0')}-${String(j).padStart(2, '0')}`,
  price: 0.25 * (j + 1) + i,
  stock: j * 3 - 2,
  active: (i + j) % 3 !== 0,
  tags: words.slice(j % 5, j % 5 + 1 + (j % 3)),
  dims: [j + 1, 2.5, 10 + i],
  attrs: { color: colors[(i + j) % colors.length], label: awkward[(i * 5 + j) % awkward.length], origin: words[(i + j) % words.length] },
  parent: j % 3 === 0 ? null : j - 1,
  history: j % 4 === 0 ? [] : { created: `2026-01-${String(1 + j % 28).padStart(2, '0')}`, by: words[j % words.length] },
})
const inventory = (i) => ({
  warehouse: `wh-${i}`,
  region: ['sa-east-1', 'us-east-1', 'eu-west-2', 'ap-south-1'][i % 4],
  updated: '2026-10-06',
  location: { lat: -23.55 + i / 10, lon: -46.63 - i / 10, zones: ['A', 'B', 'C'].slice(0, 1 + i % 3) },
  contacts: [{ name: words[i % words.length], phone: `+55 11 9${String(1000 + i)}`, roles: ['ops', 'billing'].slice(i % 2) }],
  limits: { items: 100 + i, weightKg: 1500.5, nested: { depth: i % 4, flags: { fragile: i % 2 === 0, hazmat: false } } },
  empty: { list: [], map: {}, nothing: null },
  items: Array.from({ length: 4 + i % 6 }, (_, j) => item(i, j)),
})
// Every fourth document is a top-level list of records instead.
const table = (i) => Array.from({ length: 8 + i % 5 }, (_, j) => item(i, j))
const documents = Array.from({ length: 48 }, (_, i) => (i % 4 === 3 ? table(i) : inventory(i)))

// --- YAML emitter -----------------------------------------------------------
// Flow-style YAML, restricted to what YAML 1.1 and 1.2 parsers read the same
// way. A string is written plain only when it starts with a letter, `_` or
// `/`, uses only letters, digits, spaces and `_ / . @ + = -`, and is not a
// word some schema resolves to a boolean or null. Everything else is quoted.

const CHARS = '[\\p{L}\\p{N}_/.@+=-]'
const PLAIN = new RegExp(`^(?=[\\p{L}_/])${CHARS}+(?: ${CHARS}+)*$`, 'u')
const RESERVED = /^(?:null|true|false|yes|no|on|off|y|n)$/i
const isPlain = (s) => PLAIN.test(s) && !RESERVED.test(s)
const quoted = (s) => (/[\x00-\x1f\x7f']/.test(s) ? JSON.stringify(s) : `'${s.replaceAll("'", "''")}'`)
const isMap = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isScalar = (v) => v === null || typeof v !== 'object'
const number = (n) => {
  const text = String(n)
  assert.ok(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text), `number ${text} is outside the chosen subset`)
  return text
}
const key = (k) => (isPlain(k) ? k : quoted(k))

const scalar = (v, style) => {
  if (v === null) return style.null
  if (typeof v === 'boolean') return String(v)
  if (typeof v === 'number') return number(v)
  return isPlain(v) ? v : quoted(v)
}
const comments = ['primary', 'see the runbook', 'kept for audit', 'do not reorder']

// A flow collection starting at the current position. `indent` is the column
// of the line the collection's closing bracket goes on; members of a
// multi-line collection are indented two more. Collections with only scalars,
// and everything nested deeper than `depth` 2, stay on one line.
function flow(v, style, indent, depth, multi) {
  if (isScalar(v)) return scalar(v, style)
  const entries = Array.isArray(v) ? v.map((x) => [null, x]) : Object.entries(v)
  const [open, close] = Array.isArray(v) ? ['[', ']'] : ['{', '}']
  if (entries.length === 0) return open + close
  const member = ([k, x], inner) => (k === null ? '' : `${key(k)}: `) + flow(x, style, inner, depth + 1, multi)
  if (!multi || depth >= 2 || entries.every(([, x]) => isScalar(x))) {
    return open + entries.map((e) => member(e, 0)).join(', ') + close
  }
  const pad = ' '.repeat(indent + 2)
  const lines = entries.map((e, n) => {
    const comment = style.comments && n % 3 === 0 && n < entries.length - 1 ? `  # ${comments[n % comments.length]}` : ''
    return pad + member(e, indent + 2) + (n < entries.length - 1 ? ',' : '') + comment
  })
  return `${open}\n${lines.join('\n')}\n${' '.repeat(indent)}${close}`
}

function emit(document, style) {
  const out = []
  if (style.comments) out.push('# Exported by the inventory service', '# Flow style: generated, not meant for editing.')
  if (style.marker) out.push('---')
  if (style.mode === 'flow') {
    out.push(flow(document, style, 0, 0, style.multi))
  } else if (Array.isArray(document)) {
    for (const row of document) out.push(`- ${flow(row, style, 2, 1, style.multi)}`)
  } else {
    for (const [k, v] of Object.entries(document)) {
      if (Array.isArray(v) && v.length > 0 && v.every(isMap)) {
        out.push(`${key(k)}:`)
        for (const row of v) out.push(`  - ${flow(row, style, 4, 1, style.multi)}`)
      } else {
        out.push(`${key(k)}: ${flow(v, style, 2, 1, style.multi)}`)
      }
    }
  }
  return out.join('\n') + '\n'
}

// Three layouts: whole document as one flow collection, block mapping or
// sequence whose values are flow collections; each either on single lines or
// broken over several lines.
const style = (i) => ({
  mode: i % 3 === 0 ? 'flow' : 'block',
  multi: i % 2 === 0,
  comments: i % 5 !== 4,
  marker: i % 4 === 1,
  null: ['null', '~'][i % 2],
})

export const cases = documents.map((expected, i) => ({ input: emit(expected, style(i)), expected }))

// --- Verification -----------------------------------------------------------

const plain = (x) => {
  if (Array.isArray(x)) return x.every(plain)
  if (x !== null && typeof x === 'object') return Object.getPrototypeOf(x) === Object.prototype && Object.values(x).every(plain)
  return true
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(plain(out), `fixture ${i}: plain objects and arrays required`)
    assert.deepStrictEqual(out, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (Array.isArray(value) ? value.length : value.warehouse.length)
