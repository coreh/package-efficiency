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

// 30 generated settings documents.
for (let i = 0; i < 30; i++) { const o = settings(i); add(`# generated settings ${i}\n` + emit(o), o) }

// Package manifests.
for (let i = 0; i < 3; i++) {
  const o = {
    package: { name: `tool-${i}`, version: `0.${i}.1`, edition: '2024', authors: [`Ana ${words[i]}`, 'Bo <bo@example.com>'], keywords: words.slice(i, i + 3), publish: false },
    dependencies: { serde: { version: '1', features: ['derive'], optional: i % 2 === 0 }, regex: '1.10', 'my-lib': { path: `../lib-${i}` } },
    'dev-dependencies': { criterion: { version: '0.5', 'default-features': false } },
    profile: { release: { 'opt-level': 3, lto: true, 'codegen-units': 1, debug: false }, dev: { 'opt-level': 0 } },
    bin: [{ name: 'main', path: 'src/main.rs' }, { name: `extra-${i}`, path: 'src/extra.rs', 'required-features': ['cli'] }],
  }
  add(emit(o), o)
}

// Hand-written documents using dialect features the emitter does not cover.
add(`# comments, dotted keys, inline tables, literal and multi-line strings
title = "TOML \\u00e9xample 😀"
literal = 'C:\\Users\\nodejs\\templates'
hex = 0xDEADBEEF
oct = 0o755
bin = 0b1101_0110
big = 1_000_000
neg = -17
plus = +99
frac = 3.14159
fneg = -0.5
flag = true
off = false
site."google.com".ok = true
physical.color = "orange"
physical.shape = "round"
point = { x = 1, y = 2, label = "p" }
array = [ 1, 2, 3, ]
nested = [[1, 2], ["a", "b"], [0.5]]
mixed = [ { a = 1 }, { b = "two" } ]
str1 = """
Roses are red
Violets are blue"""
str2 = """\\
   The quick brown \\
   fox jumps over \\
   the lazy dog."""
str3 = '''
raw \\n text
  kept'''

[owner]
name = "Tom" # trailing comment
bio = "tabs\\there"

[database]
ports = [ 8000, 8001, 8002 ]
data = [ ["delta", "phi"], [3.5] ]
temp_targets = { cpu = 79.5, case = 72.5 }

  [servers.alpha]
  ip = "10.0.0.1"
  role = "frontend"

  [servers.beta]
  ip = "10.0.0.2"
  role = "backend"

[[products]]
name = "Hammer"
sku = 738594937

[[products]]

[[products]]
name = "Nail"
sku = 284758393
color = "gray"
`, {
  title: 'TOML éxample 😀', literal: 'C:\\Users\\nodejs\\templates', hex: 0xdeadbeef, oct: 0o755, bin: 0b11010110, big: 1000000, neg: -17, plus: 99, frac: 3.14159, fneg: -0.5, flag: true, off: false,
  site: { 'google.com': { ok: true } }, physical: { color: 'orange', shape: 'round' }, point: { x: 1, y: 2, label: 'p' }, array: [1, 2, 3], nested: [[1, 2], ['a', 'b'], [0.5]], mixed: [{ a: 1 }, { b: 'two' }],
  str1: 'Roses are red\nViolets are blue', str2: 'The quick brown fox jumps over the lazy dog.', str3: 'raw \\n text\n  kept',
  owner: { name: 'Tom', bio: 'tabs\there' }, database: { ports: [8000, 8001, 8002], data: [['delta', 'phi'], [3.5]], temp_targets: { cpu: 79.5, case: 72.5 } },
  servers: { alpha: { ip: '10.0.0.1', role: 'frontend' }, beta: { ip: '10.0.0.2', role: 'backend' } },
  products: [{ name: 'Hammer', sku: 738594937 }, {}, { name: 'Nail', sku: 284758393, color: 'gray' }],
})

// Two small extra documents.
add('# only a comment and one key\nanswer = 42\n', { answer: 42 })
{
  const o = { project: { name: 'demo', version: '1.2.3', description: 'A demo – café ☕', requires: ['python >= 3.9'], classifiers: ['A :: B', 'C :: D'] }, tool: { fmt: { 'line-length': 88, exclude: ['build', 'dist'] }, lint: { select: ['E', 'F'], strict: true, ratio: 0.75 } } }
  add(emit(o), o)
}

// Four lockfiles, the largest about 5,000 lines.
for (const [count, seed] of [[10, 1], [60, 2], [300, 3], [800, 4]]) {
  const o = lockfile(count, seed)
  add('# This file is automatically @generated.\n' + emit(o), o)
}

export { cases }

const plain = (x) => {
  if (Array.isArray(x)) return x.every(plain)
  if (x !== null && typeof x === 'object') {
    const proto = Object.getPrototypeOf(x)
    return (proto === Object.prototype || proto === null) && Object.values(x).every(plain)
  }
  return true
}
// Some parsers return objects without a prototype; copy them to plain objects for comparison.
const normalize = (x) => Array.isArray(x) ? x.map(normalize) : x !== null && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, normalize(v)])) : x
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(plain(out), `fixture ${i}: plain tables and arrays required`)
    assert.deepStrictEqual(normalize(out), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => Array.isArray(value) ? value.length : Object.keys(value).length
