import { strict as assert } from 'node:assert'
// Namespaces of a mid-sized application and its dependencies. The pattern
// (given to every adapter once, at load) enables prefixes; near misses such as
// app:webhook:* or lib:http-cache:* share a start with enabled ones but are not.
const enabledPrefixes = ['app:web:', 'app:db:', 'app:cache:', 'app:auth:', 'lib:http:', 'worker:', 'svc:billing:']
const groups = [
  ['app:web', 'router', 'session', 'static', 'ws', 'render'],
  ['app:db', 'pool', 'query', 'migrate', 'tx'],
  ['app:cache', 'redis', 'lru', 'warm'],
  ['app:auth', 'jwt', 'oauth', 'ldap', 'mfa'],
  ['app:queue', 'consumer', 'producer', 'retry'],
  ['app:search', 'index', 'query', 'suggest'],
  ['app:webhook', 'send', 'verify'],
  ['app:fs', 'read', 'write', 'watch'],
  ['lib:http', 'client', 'server', 'retry', 'pool', 'tls'],
  ['lib:http-cache', 'store', 'revalidate'],
  ['lib:stream', 'pipe', 'backpressure', 'transform'],
  ['worker', 'image', 'email', 'report', 'cleanup', 'export'],
  ['svc:billing', 'invoice', 'ledger', 'webhook', 'refund'],
  ['svc:shipping', 'label', 'rates', 'tracking'],
  ['svc:billing-legacy', 'sync', 'import'],
]
export const cases = []
for (const [prefix, ...names] of groups) {
  for (const name of names) {
    for (const suffix of ['', ':v2', ':trace']) {
      const ns = `${prefix}:${name}${suffix}`
      cases.push({ input: { ns }, expected: enabledPrefixes.some(p => ns.startsWith(p)) })
    }
  }
}
cases.push(
  { input: { ns: 'app:web:' }, expected: true },
  { input: { ns: 'app:web' }, expected: false },
  { input: { ns: 'app' }, expected: false },
  { input: { ns: 'worker:ünïcode:日本' }, expected: true },
  { input: { ns: 'misc:startup' }, expected: false },
  { input: { ns: '@acme/widgets:render' }, expected: false },
  { input: { ns: 'workers:pool' }, expected: false },
)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) assert.equal(outputs[i], expected, `fixture ${i} (${input.ns}): expected ${expected}`)
  const on = outputs.filter(Boolean).length
  assert.ok(on > 20 && on < outputs.length - 20, 'the fixtures are a real mix of enabled and disabled namespaces')
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => Number(value)
