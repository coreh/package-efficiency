import { strict as assert } from 'node:assert'

const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo', 'naïve 😀']
const escapes = ['line\nbreak', 'say "hi"', 'back\\slash', 'tab\there', 'plain', 'Tom & Jerry <b>']

// Deterministic emitter for the generated documents. Strings use JSON escapes,
// which are all valid TOML basic-string escapes.
const key = (k) => (/^[A-Za-z0-9_-]+$/.test(k) ? k : JSON.stringify(k))
const isTable = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isTables = (v) => Array.isArray(v) && v.length > 0 && v.every(isTable)
const scalar = (v) => {
  if (typeof v === 'string') return JSON.stringify(v)
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v)
  if (typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return '[' + v.map(scalar).join(', ') + ']'
  return '{ ' + Object.entries(v).map(([k, x]) => `${key(k)} = ${scalar(x)}`).join(', ') + ' }'
}
const emit = (obj, path = []) => {
  let out = ''
  const subs = []
  for (const [k, v] of Object.entries(obj)) {
    if (isTable(v) || isTables(v)) subs.push([k, v])
    else out += `${key(k)} = ${scalar(v)}\n`
  }
  for (const [k, v] of subs) {
    const p = [...path, key(k)]
    if (isTable(v)) out += `\n[${p.join('.')}]\n` + emit(v, p.map((x) => x))
    else for (const t of v) out += `\n[[${p.join('.')}]]\n` + emit(t, p)
  }
  return out
}

const route = (i, j) => ({ path: `/api/v${1 + (j % 3)}/items/${i}-${j}`, method: ['GET', 'POST', 'PUT', 'DELETE'][j % 4], auth: j % 3 === 0, timeoutMs: 250 * (j + 1), tags: words.slice(j % 4, (j % 4) + 3) })
const settings = (i) => ({
  name: `service-${i}`,
  version: `${1 + (i % 4)}.${i % 10}.${i % 7}`,
  enabled: i % 3 !== 0,
  description: words[i % words.length] + ' ' + escapes[i % escapes.length],
  server: { host: `10.0.${i}.${i % 250}`, port: 8000 + i, tls: { enabled: i % 2 === 0, ciphers: ['TLS_AES_128', 'TLS_AES_256'], minVersion: 1.5 } },
  database: { url: `postgres://user${i}@db.example.com:5432/app_${i}`, pool: { min: i % 5, max: 10 + i, idleSeconds: 30.5 }, replicas: Array.from({ length: i % 4 }, (_, j) => ({ host: `replica-${j}.example.com`, weight: j + 0.5 })) },
  logging: { level: ['debug', 'info', 'warn', 'error'][i % 4], targets: [{ type: 'console', color: true }, { type: 'file', path: `/var/log/svc-${i}.log`, rotate: { sizeMb: 50, keep: 7 } }] },
  features: Object.fromEntries(Array.from({ length: 3 + (i % 6) }, (_, j) => [`flag_${j}`, (i + j) % 2 === 0])),
  limits: [0, 1, -1, 100000 + i, 0.5, -2.5, 1024 * i],
  routes: Array.from({ length: 1 + (i % 12) }, (_, j) => route(i, j)),
  'quoted key': { 'dotted.name': i, empty: [], 'ünï': words[(i + 3) % words.length] },
})
const hex = (n, len) => { let s = ''; let x = (n * 2654435761) >>> 0; while (s.length < len) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; s += x.toString(16).padStart(8, '0') } return s.slice(0, len) }
const lockfile = (count, seed) => {
  const names = Array.from({ length: count }, (_, i) => `crate-${seed}-${i}`)
  return {
    version: 4,
    package: names.map((name, i) => {
      const p = { name, version: `${i % 5}.${i % 13}.${i % 29}` }
      if (i % 4 !== 0) { p.source = 'registry+https://github.com/rust-lang/crates.io-index'; p.checksum = hex(i + seed, 64) }
      const deps = []
      for (let d = 1; d <= i % 6 && i - d >= 0; d++) deps.push(names[i - d] + (d % 2 ? '' : ` ${(i - d) % 5}.${(i - d) % 13}.${(i - d) % 29}`))
      if (deps.length) p.dependencies = deps
      return p
    }),
  }
}


const cases = []
const add = (input, expected) => cases.push({ input, expected })

// Malformed lines. Each is placed at the start of the document (an early error), before a table
// header near the middle, or at the end (an error found only after parsing the whole document).
// An 'end' line only makes sense at the end.
const bad = [
  ['end', '\n[server]\nhost = "again"\n'], // table defined twice
  ['any', 'broken = "unterminated\n'],
  ['any', 'broken = 01\n'],
  ['any', 'broken = [1, 2\n'],
  ['any', 'broken = "bad \\q escape"\n'],
  ['any', '= 5\n'],
  ['any', 'broken = 1 2\n'],
  ['any', 'broken = tru\n'],
  ['any', 'broken =\n'],
  ['any', 'broken = 1__0\n'],
  ['any', '[unclosed\n'],
  ['any', "broken = 'unterminated literal\n"],
]
// The blank line before the table header closest to the middle of the document.
const middle = (doc) => {
  const at = []
  for (let k = doc.indexOf('\n\n['); k !== -1; k = doc.indexOf('\n\n[', k + 1)) at.push(k + 1)
  return at.reduce((best, k) => (Math.abs(k - doc.length / 2) < Math.abs(best - doc.length / 2) ? k : best))
}

// 10 valid and 24 malformed generated settings documents: 10 with the defect at the start, 8 in the
// middle and 6 at the end. The place shifts between a line's two uses, so no defect keeps one place.
for (let i = 0; i < 10; i++) { const o = settings(i); add(`# generated settings ${i}\n` + emit(o), true) }
for (let i = 10; i < 34; i++) {
  const [where, line] = bad[i % bad.length]
  const doc = emit(settings(i))
  const head = `# generated settings ${i}\n`
  const place = where === 'end' ? 'end' : ['start', 'middle', 'end', 'middle', 'start'][(i + Math.floor(i / 12)) % 5]
  if (place === 'start') add(head + line + doc, false)
  else if (place === 'middle') { const k = middle(doc); add(head + doc.slice(0, k) + line + doc.slice(k), false) }
  else add(head + doc + (line.startsWith('[') || where === 'end' ? line : '\n' + line), false)
}

// One small lockfile: valid, and with a broken table header as the last line (found after the whole file is read).
for (const [count, seed] of [[30, 2]]) {
  const text = '# This file is automatically @generated.\n' + emit(lockfile(count, seed))
  add(text, true)
  add(text + '[[package\nname = "x"\n', false)
}

// Hand-written documents.
add('answer = 42\n', true)
add('answer = 42\nanswer2 =\n', false)
add('a = [1, 2\nb = 3\n', false)
add('[a]\nb = 1\n[a.b]\nc = 2\n', false)
add('x = """\nunterminated\n', false)
add('s = "tab\there ok"\nu = "\\u00e9 \\u65e5"\nm = { a = 1, b = [1, 2, { c = 3 }] }\n', true)

export { cases }

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.strictEqual(outputs[i], expected, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (value ? 1 : 0)
