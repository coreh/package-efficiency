import { strict as assert } from 'node:assert'

// --- Source data ------------------------------------------------------------
// The fixtures are written from this data by the emitter below, so the
// expected value of every fixture is the data itself, not a parser's output.

const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo', 'naïve 😀']
// Strings a YAML writer has to quote: text another type would claim, text
// that starts or contains an indicator, text with escapes.
const awkward = [
  'line\nbreak', 'say "hi"', 'back\\slash', 'tab\there', "it's fine", 'Tom & Jerry <b>',
  'true', 'null', 'yes', 'off', '~', '8080', '0755', '1e3', '3.14', '2026-10-06', '12:30:45',
  'key: value', 'trailing colon:', '#hashtag', 'not # a comment', '- dash', '*star', '&anchor', '!tag',
  '@scope/pkg', '[bracketed]', '{{ template }}', '100%', '| pipe', '> quote', ' padded ', 'a, b',
]
const sentences = [
  'Handles checkout requests for the storefront and forwards settled orders to the billing queue.',
  'Serves resized product images from object storage; falls back to the origin when the cache is cold: see the runbook.',
  'Nightly reconciliation between the ledger and the payment provider, with a report mailed to finance #ops.',
  'Edge proxy for partner integrations. Rate limits are per API key, not per address, and reset on the hour.',
]
const script = (i) => [
  '#!/bin/sh',
  'set -eu',
  '',
  `curl --fail --silent "http://127.0.0.1:${8000 + i}/healthz" > /dev/null`,
  'if [ "$?" -ne 0 ]; then',
  `  echo "service-${i}: unhealthy" >&2`,
  '  exit 1',
  'fi',
].slice(0, 4 + i % 5).join('\n') + (i % 2 ? '\n' : '')
const certificate = (i) => ['-----BEGIN CERTIFICATE-----', ...Array.from({ length: 2 + i % 3 }, (_, j) => `MIIB${String(i).padStart(2, '0')}${'QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo'.repeat(2).slice(j, j + 56)}`), '-----END CERTIFICATE-----'].join('\n') + '\n'

const route = (i, j) => ({
  path: `/api/v${1 + j % 3}/items/${i}-${j}`,
  method: ['GET', 'POST', 'PUT', 'DELETE'][j % 4],
  auth: j % 3 === 0,
  timeoutMs: 250 * (j + 1),
  tags: words.slice(j % 4, j % 4 + 3),
  rewrite: j % 4 === 1 ? null : awkward[(i + j) % awkward.length],
})
const service = (i) => ({
  name: `service-${i}`,
  version: `${1 + i % 4}.${i % 10}.${i % 7}`,
  enabled: i % 3 !== 0,
  owner: words[i % words.length],
  description: sentences[i % sentences.length],
  motd: awkward[i % awkward.length],
  server: {
    host: `10.0.${i}.${i % 250}`,
    port: 8000 + i,
    tls: { enabled: i % 2 === 0, ciphers: ['TLS_AES_128', 'TLS_AES_256'], minVersion: 1.5, certificate: certificate(i) },
    cors: null,
  },
  database: {
    url: `postgres://user${i}@db.example.com:5432/app_${i}`,
    pool: { min: i % 5, max: 10 + i, idleSeconds: 30.5 },
    replicas: Array.from({ length: i % 4 }, (_, j) => ({ host: `replica-${j}.example.com`, weight: j + 0.5 })),
  },
  logging: {
    level: ['debug', 'info', 'warn', 'error'][i % 4],
    targets: [{ type: 'console', color: true }, { type: 'file', path: `/var/log/svc-${i}.log`, rotate: { sizeMb: 50, keep: 7 } }],
  },
  env: { LOG_FORMAT: 'json', PORT: String(8000 + i), DEBUG: i % 2 ? 'false' : 'true', TZ: 'America/Sao_Paulo', GREETING: awkward[(i * 7 + 3) % awkward.length], EMPTY: '' },
  healthcheck: { schedule: `*/${5 + i % 4} * * * *`, retries: 1 + i % 5, script: script(i), fallback: null },
  errorPages: { 404: '/errors/not-found.html', 500: '/errors/server.html' },
  features: Object.fromEntries(Array.from({ length: 3 + i % 6 }, (_, j) => [`flag_${j}`, (i + j) % 2 === 0])),
  limits: [0, 1, -1, 100000 + i, 0.5, -2.5, 1024 * i],
  matrix: Array.from({ length: 1 + i % 3 }, (_, j) => [j, i + j, 0.25 * (j + 1)]),
  routes: Array.from({ length: 1 + i % 12 }, (_, j) => route(i, j)),
  empty: { list: [], map: {}, text: '' },
})
// Every eighth document is a top-level sequence instead: a list of scheduled jobs.
const jobs = (i) => Array.from({ length: 2 + i % 5 }, (_, j) => ({
  name: `job-${i}-${j}`,
  schedule: `${j * 7 % 60} */${1 + j} * * *`,
  command: ['/usr/local/bin/worker', '--queue', words[(i + j) % words.length], '--limit', String(100 * (j + 1))],
  description: sentences[(i + j) % sentences.length],
  retries: j % 4,
  backoffSeconds: 1.5 * (j + 1),
  notify: j % 2 ? null : { channel: '#ops-alerts', onFailure: true, onSuccess: false },
  env: j % 3 ? { REGION: 'sa-east-1', DRY_RUN: 'no' } : {},
  script: script(i + j),
}))
const documents = Array.from({ length: 48 }, (_, i) => (i % 8 === 7 ? jobs(i) : service(i)))

// --- YAML emitter -----------------------------------------------------------
// Block-style YAML restricted to what YAML 1.1 and YAML 1.2 parsers read the
// same way. A string is written plain only when it starts with a letter, `_`
// or `/`, is built from the unambiguous characters below, and is not a word
// some schema resolves to a boolean or null; everything else is quoted.

const CHARS = '[\\p{L}\\p{N}_/.@+=-]'
const WORD = `${CHARS}+(?::${CHARS}+)*`
const PLAIN = new RegExp(`^(?=[\\p{L}_/])${WORD}(?: ${WORD})*$`, 'u')
const RESERVED = /^(?:null|true|false|yes|no|on|off|y|n)$/i
const isPlain = (s) => PLAIN.test(s) && !RESERVED.test(s)
const quoted = (s) => (/[\x00-\x1f\x7f']/.test(s) ? JSON.stringify(s) : `'${s}'`)
const key = (k) => (isPlain(k) ? k : quoted(k))
const isMap = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isScalar = (v) => v === null || typeof v !== 'object'
const isCollection = (v) => (Array.isArray(v) ? v.length > 0 : isMap(v) && Object.keys(v).length > 0)

// Literal block scalar: longer multi-line text with no trailing spaces, no
// tabs and at most one final newline. Folded block scalar: one long paragraph.
const isLiteral = (s) => s.length > 30 && s.includes('\n') && !/^[ \n]| \n|\n\n$| $|[\x00-\x09\x0b-\x1f\x7f]/.test(s)
const isFolded = (s) => s.length > 72 && /^[\p{L}\p{N}\p{P}\p{S}]+(?: [\p{L}\p{N}\p{P}\p{S}]+)*$/u.test(s)
const wrap = (s, width) => {
  const lines = ['']
  for (const word of s.split(' ')) {
    const last = lines.length - 1
    if (lines[last] === '') lines[last] = word
    else if (lines[last].length + 1 + word.length <= width) lines[last] += ' ' + word
    else lines.push(word)
  }
  return lines
}

const number = (n) => {
  const text = String(n)
  assert.ok(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text), `number ${text} is outside the chosen subset`)
  return text
}

const sectionComments = {
  server: 'Network listener',
  database: 'Primary database and read replicas',
  logging: 'Log output',
  env: 'Passed to the process as-is; values are always strings',
  features: 'Feature flags',
  routes: 'Route table, matched top to bottom',
}
const trailingComments = { port: 'listen port', max: 'upper bound', retries: 'attempts before giving up', keep: 'rotated files to keep', timeoutMs: 'milliseconds', cors: 'not configured' }

function emit(document, style) {
  const out = []
  // Scalars written on the key's line (or after the dash).
  const inline = (v, flow = false) => {
    if (v === null) return flow && style.null === '' ? 'null' : style.null
    if (typeof v === 'boolean') return String(v)
    if (typeof v === 'number') return number(v)
    if (Array.isArray(v)) return '[]'
    if (typeof v === 'object') return '{}'
    if (v === '') return style.emptyString
    return isPlain(v) ? v : quoted(v)
  }
  const flowSequence = (items) => `[${items.map((item) => inline(item, true)).join(', ')}]`
  const isFlow = (name, v) => Array.isArray(v) && v.length > 0 && v.every(isScalar) && style.flow && (name === 'ciphers' || name === 'tags' || name === 'command')
  // Writes `head` followed by the value: on the same line for scalars and
  // flow sequences, on the following lines for block scalars and collections.
  const value = (head, v, indent, name, compact) => {
    if (typeof v === 'string' && (isLiteral(v) || isFolded(v))) {
      const pad = ' '.repeat(indent + 2)
      if (isLiteral(v)) {
        const body = v.endsWith('\n') ? v.slice(0, -1) : v
        out.push(`${head} ${v.endsWith('\n') ? '|' : '|-'}`)
        for (const line of body.split('\n')) out.push(line === '' ? '' : pad + line)
      } else {
        out.push(`${head} >-`)
        for (const line of wrap(v, 64)) out.push(pad + line)
      }
    } else if (isFlow(name, v)) {
      out.push(`${head} ${flowSequence(v)}`)
    } else if (isCollection(v)) {
      out.push(head)
      if (Array.isArray(v)) sequence(v, compact ? indent : indent + 2)
      else mapping(v, indent + 2)
    } else {
      const text = inline(v)
      const comment = style.comments && name in trailingComments ? `  # ${trailingComments[name]}` : ''
      out.push(`${head}${text === '' ? '' : ' ' + text}${comment}`)
    }
  }
  const mapping = (map, indent) => {
    const pad = ' '.repeat(indent)
    for (const [name, v] of Object.entries(map)) {
      if (indent === 0 && style.comments && name in sectionComments) out.push('', `# ${sectionComments[name]}`)
      value(`${pad}${key(name)}:`, v, indent, name, style.compactSequences)
    }
  }
  const sequence = (items, indent) => {
    const pad = ' '.repeat(indent)
    for (const item of items) {
      const start = out.length
      if (isCollection(item) && isMap(item)) {
        mapping(item, indent + 2)
        out[start] = `${pad}- ${out[start].slice(indent + 2)}`
      } else if (isCollection(item)) {
        out.push(`${pad}- ${flowSequence(item)}`)
      } else {
        value(`${pad}-`, item, indent, '', false)
      }
    }
  }
  if (style.comments) out.push(`# ${style.title}`, '# Managed by the deploy tooling: edit the template, not this file.')
  if (style.marker) out.push('---')
  if (Array.isArray(document)) sequence(document, 0)
  else mapping(document, 0)
  return out.join('\n') + '\n'
}

const style = (i) => ({
  title: i % 8 === 7 ? `Scheduled jobs, group ${i}` : `service-${i} configuration`,
  comments: i % 5 !== 4,
  marker: i % 4 === 1,
  null: ['null', '~', ''][i % 3],
  emptyString: i % 2 ? '""' : "''",
  flow: i % 3 !== 2,
  compactSequences: i % 4 === 3,
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
export const consume = (value) => (Array.isArray(value) ? value.length : Object.keys(value).length)
