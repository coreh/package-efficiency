import { strict as assert } from 'node:assert'
// Patterns share one syntax across JavaScript, Rust, Python, Ruby and Go. Every
// capture group takes part in every match and no pattern can match the empty
// string, so every engine reports the same groups.
const patterns = [
  String.raw`(\d{4})-(\d{2})-(\d{2})`,
  String.raw`([A-Z][A-Z_]+)=(\d+)`,
  String.raw`([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})`,
  String.raw`(https?)://([^\s/]+)(/[^\s]*)`,
  String.raw`\b(GET|POST|PUT|DELETE) (/[\w/.-]*) from (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})`,
  String.raw`#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})\b`,
  String.raw`\$(\d+)\.(\d{2})`,
  String.raw`(\w+)\.(js|ts|rs|py|rb|go)\b`,
  String.raw`"([^"\\]*(?:\\.[^"\\]*)*)"`,
  String.raw`\b(\d+(?:\.\d+)?)(ms|s|MB|KB)\b`,
  String.raw`(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})`,
  String.raw`\b(error|warn|fatal) (\w+) (\w+)`,
  String.raw`(\w+)-(\d+)-(\w+):`,
  String.raw`(\d+):(\d{2})`,
  String.raw`(a+)(b+)`,
  String.raw`\b([A-Z][a-z]+) (\w+)`,
  String.raw`v(\d)/(\w+)/(\d+)\.json`,
  String.raw`support\+(\d+)@(\w+)\.(org|com)`,
  String.raw`(\w+) (\w+) (\w+) (\w+) said`,
  String.raw`@mail(\d)\.example\.(com)`,
]
const words = ['the', 'quick', 'brown', 'Fox', 'jumps', 'over', 'lazy', 'Dog', 'database', 'connection', 'established', 'Server', 'request', 'timeout', 'abba', 'baab', 'foobar', 'foo', 'bar', 'authentication', 'cache', 'Queue', 'worker', 'retry', 'beautiful', 'Release', 'deployment', 'engine', 'feature', 'ababab']
const levels = ['error', 'warn', 'info', 'debug', 'fatal']
const files = ['main.rs', 'index.js', 'app.py', 'server.go', 'util.rb', 'types.ts', 'README.md', 'data.json']
const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const line = (i, j) => {
  const k = i * 31 + j * 7
  const w = (n) => words[(k + n * 5) % words.length]
  switch (j % 10) {
    case 0: return `2026-${String(1 + k % 12).padStart(2, '0')}-${String(1 + k % 28).padStart(2, '0')} ${levels[(k + j) % 5]} ${w(0)} ${w(1)} ${w(2)} after ${k % 900 + 1}ms`
    case 1: return `${methods[k % 5]} /api/v${1 + k % 3}/${w(0)}/${k % 1000}.json from 10.${k % 256}.${(k * 3) % 256}.${(k * 7) % 256} took ${(k % 50) / 10 + 1}s`
    case 2: return `Contact ${w(0)}.${w(1)}${k % 90}@mail${k % 7}.example.com or support+${k % 40}@${w(2)}.org for help with ${w(3)}.`
    case 3: return `See https://www.${w(0)}.example.com/docs/${w(1)}?page=${k % 20}&sort=asc#${w(2)} and http://${w(3)}.test/${k}.`
    case 4: return `Total $${k % 500}.${String(k % 100).padStart(2, '0')} plus $${k % 90} fee, colors #${(k * 2654435).toString(16).padStart(6, '0').slice(-6)} and #${(k * 40503).toString(16).padStart(6, '0').slice(-6).toUpperCase()}.`
    case 5: return `${w(0)} ${w(1)} ${w(2)} ${w(3)} ${w(4)} said "${w(5)} \\"${w(6)}\\" ${w(7)}" and "${w(8)}" at ${k % 24}:${String(k % 60).padStart(2, '0')}.`
    case 6: return `Set MAX_RETRY_COUNT=${k % 9} and DB_POOL_SIZE=${10 + k % 90}; HTTP_TIMEOUT stays at ${k % 30}s, cache ${k % 64}MB, buffer ${k % 512}KB.`
    case 7: return `Changed ${files[k % 8]} and ${files[(k + 3) % 8]} in ${w(0)}/${files[(k + 5) % 8]}; reviewers ${w(1)} ${w(2)}.`
    case 8: return `${w(0)} ${w(1)} ${w(2)} ${w(3)} ${w(4)} ${w(5)} ${w(6)} ${w(7)} ${w(8)} ${w(9)} ${w(10)} ${w(11)}`
    default: return `${w(0)}-${k}-${w(1)}: ababab baba abba ${w(2)} ${w(3)} beautiful ${k % 77} ${levels[(k + 2 * j) % 5]} 192.168.${k % 255}.${(k * 13) % 255}`
  }
}
const textFor = (i) => Array.from({ length: 36 + (i % 5) * 4 }, (_, j) => line(i, j)).join('\n')
// Reference: one list per match holding groups 1..n, in order.
const reference = (pattern, text) => Array.from(text.matchAll(new RegExp(pattern, 'g')), (m) => m.slice(1))
const inputs = patterns.flatMap((pattern, p) => [0, 1].map((n) => ({ pattern, text: textFor(p * 2 + n + 2) })))
for (const { text } of inputs) assert.ok(/^[\x00-\x7f]*$/.test(text), 'texts are ASCII')
export const cases = inputs.map((input) => ({ input, expected: reference(input.pattern, input.text) }))
// Every pattern must find something, so an empty answer is never right by luck.
for (const [i, { expected }] of cases.entries()) {
  assert.ok(expected.length > 0, `fixture ${i} has matches`)
  assert.ok(expected.every((g) => g.every((x) => typeof x === 'string')), `fixture ${i}: every group takes part`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out) && out.every((m) => Array.isArray(m) && m.every((g) => typeof g === 'string')), `fixture ${i}: list of lists of strings required`)
    assert.deepStrictEqual(out, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
