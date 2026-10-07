import { strict as assert } from 'node:assert'

// --- Source data ------------------------------------------------------------
// The fixtures are written from this data by the emitter below, so the
// expected value of every fixture is the data itself, not a parser's output.

const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo', 'naïve 😀']
// Strings with escapes, and strings that look like comment or structure
// syntax and must be left alone by a comment scanner.
const awkward = [
  'line\nbreak', 'say "hi"', 'back\\slash', 'tab\there', 'plain', 'Tom & Jerry <b>',
  'not // a comment', '/* still a string */', 'ends with a backslash \\', 'quote then slashes "//" inside',
  'trailing, comma,]', '{ "nested": [1, 2,], }', "it's", '*/', 'C:\\Program Files\\app\\', 'https://example.com/a?b=1&c=[2]#frag',
]
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
  description: words[i % words.length] + ' ' + awkward[i % awkward.length],
  server: {
    host: `10.0.${i}.${i % 250}`,
    port: 8000 + i,
    tls: { enabled: i % 2 === 0, ciphers: ['TLS_AES_128', 'TLS_AES_256'], minVersion: 1.5 },
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
  env: { LOG_FORMAT: 'json', PORT: String(8000 + i), TZ: 'America/Sao_Paulo', GREETING: awkward[(i * 7 + 3) % awkward.length], EMPTY: '' },
  features: Object.fromEntries(Array.from({ length: 3 + i % 6 }, (_, j) => [`flag_${j}`, (i + j) % 2 === 0])),
  limits: [0, 1, -1, 100000 + i, 0.5, -2.5, 1024 * i],
  matrix: Array.from({ length: 1 + i % 3 }, (_, j) => [j, i + j, 0.25 * (j + 1)]),
  routes: Array.from({ length: 1 + i % 12 }, (_, j) => route(i, j)),
  empty: { list: [], map: {}, text: '' },
})
// Every eighth document is a top-level array instead: a list of editor tasks.
const tasks = (i) => Array.from({ length: 2 + i % 5 }, (_, j) => ({
  label: `task-${i}-${j}`,
  type: j % 2 ? 'shell' : 'process',
  command: '/usr/local/bin/worker',
  args: ['--queue', words[(i + j) % words.length], '--limit', String(100 * (j + 1))],
  problemMatcher: j % 3 ? [] : ['$tsc', '$eslint-stylish'],
  group: j % 2 ? null : { kind: 'build', isDefault: j === 0 },
  options: { cwd: '${workspaceFolder}/packages/' + words[j % 5], env: j % 3 ? { REGION: 'sa-east-1', NOTE: awkward[(i + j) % awkward.length] } : {} },
  retries: j % 4,
  backoffSeconds: 1.5 * (j + 1),
}))
const documents = Array.from({ length: 48 }, (_, i) => (i % 8 === 7 ? tasks(i) : service(i)))

// --- JSON-with-comments emitter ---------------------------------------------
// Standard JSON tokens (JSON.stringify writes every string and number) plus
// the two additions JSONC and JSON5 share: `//` and `/* */` comments, and a
// comma after the last member of an object or array.

const sectionComments = {
  server: 'Network listener',
  database: 'Primary database and read replicas',
  logging: 'Log output: "console" and "file" targets',
  env: "Passed to the process as-is; values are always strings, don't use numbers",
  features: 'Feature flags',
  routes: 'Route table, matched top to bottom',
}
const trailingComments = { port: 'listen port', max: 'upper bound', retries: 'attempts before giving up', keep: 'rotated files to keep', timeoutMs: 'milliseconds', minVersion: 'TLS 1.2 is rejected // see the security policy' }
const inlineComments = { cors: 'not configured', group: 'optional', rewrite: 'target' }

const isMap = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isScalar = (v) => v === null || typeof v !== 'object'
const size = (v) => (Array.isArray(v) ? v.length : isMap(v) ? Object.keys(v).length : 0)

function emit(document, style) {
  const out = []
  const pad = (depth) => style.indent.repeat(depth)
  const fitsOneLine = (v) => Array.isArray(v) && v.length > 0 && v.every(isScalar) && JSON.stringify(v).length <= 48
  // Appends the value to the open line `head`; `tail` is the comma (or
  // nothing) and the comment that follow it.
  const value = (head, v, depth, tail) => {
    if (size(v) === 0) out.push(`${head}${JSON.stringify(v)}${tail}`)
    else if (fitsOneLine(v)) out.push(`${head}[${v.map((item) => JSON.stringify(item)).join(', ')}]${tail}`)
    else {
      const entries = Array.isArray(v) ? v.map((item) => ['', item]) : Object.entries(v)
      out.push(`${head}${Array.isArray(v) ? '[' : '{'}`)
      entries.forEach(([name, item], index) => {
        const comma = index < entries.length - 1 || style.trailingCommas ? ',' : ''
        let before = ''
        let after = ''
        if (style.comments) {
          if (depth === 0 && name in sectionComments) {
            if (style.blockSections) out.push('', `${pad(1)}/*`, `${pad(1)} * ${sectionComments[name]}`, `${pad(1)} */`)
            else out.push('', `${pad(1)}// ${sectionComments[name]}`)
          }
          if (name in trailingComments && isScalar(item)) after = ` // ${trailingComments[name]}`
          if (name in inlineComments) before = `/* ${inlineComments[name]} */ `
        }
        value(`${pad(depth + 1)}${Array.isArray(v) ? '' : `${JSON.stringify(name)}: `}${before}`, item, depth + 1, comma + after)
      })
      out.push(`${pad(depth)}${Array.isArray(v) ? ']' : '}'}${tail}`)
    }
  }
  if (style.comments) {
    if (style.blockSections) out.push('/**', ` * ${style.title}`, ' * Managed by the deploy tooling: edit the "template", not this file.', ' */')
    else out.push(`// ${style.title}`, '// Managed by the deploy tooling: edit the "template", not this file.')
  }
  value('', document, 0, '')
  if (style.comments && style.trailingCommas) out.push('// end of file')
  return out.join('\n') + '\n'
}

const style = (i) => ({
  title: i % 8 === 7 ? `Tasks, group ${i}` : `service-${i} configuration`,
  comments: i % 5 !== 4,
  blockSections: i % 3 === 1,
  trailingCommas: i % 4 !== 2,
  indent: ['  ', '    ', '\t'][i % 3],
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
