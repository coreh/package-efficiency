import { strict as assert } from 'node:assert'
let seed = 987651
const rnd = (n) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed >>> 8) % n }
const vocab = {
  log: ['INFO', 'WARN', 'ERROR', 'request', 'handled', 'timeout', 'user', 'session', 'cache', 'miss', 'hit', 'GET', 'POST', '/api/v1/items', '200', '404', '500', 'latency=12ms', 'retrying', 'connection', 'closed', 'worker-3', 'worker-7'],
  prose: ['the', 'of', 'and', 'a', 'to', 'in', 'he', 'she', 'where', 'there', 'then', 'committee', 'river', 'storm', 'letter', 'morning', 'quietly', 'walked', 'home', 'over', 'hills', 'with', 'them'],
  header: ['Content-Type', 'Content-Length', 'Accept', 'application/json', 'text/html', 'gzip', 'keep-alive', 'Host:', 'User-Agent', 'Cache-Control', 'no-cache', 'max-age=0', 'Set-Cookie', 'Origin']
}
const kinds = Object.keys(vocab)
const makeText = (kind, size) => {
  const words = vocab[kind]; let out = ''
  while (out.length < size) out += words[rnd(words.length)] + (rnd(9) === 0 ? '\n' : ' ')
  return out.slice(0, size)
}
const hasSelfOverlap = (s) => { for (let k = 1; k < s.length; k++) if (s.slice(0, k) === s.slice(s.length - k)) return true; return false }
const oracle = (text, needle) => { const r = []; for (let i = 0; i + needle.length <= text.length; i++) if (text.startsWith(needle, i)) r.push(i); return r }
const needleSets = {
  log: ['\n', '/a', 'ERROR', 'latency=12ms', 'session cache miss hit', 'worker-3', '503 ', 'zzq-absent'],
  prose: ['\n', 'th', 'storm', 'storm letter', 'river quietly walked home', 'committee', 'Zebra', 'he '],
  header: ['\n', 'Co', 'Accept', 'Content-Type', 'Content-Length gzip', 'no-cache', 'Origin', 'max-age=0 ']
}
const sizes = [2000, 8000, 24000, 64000, 128000, 16000]
export const cases = []
for (let i = 0; i < 48; i++) {
  const kind = kinds[Math.floor(i / 8) % 3]
  const text = makeText(kind, sizes[(i + Math.floor(i / 8)) % 6])
  const needle = needleSets[kind][i % 8]
  cases.push({ input: { text, needle }, expected: oracle(text, needle) })
}
for (const c of cases) assert.ok(c.input.needle.length > 0 && !hasSelfOverlap(c.input.needle))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepEqual(outputs[i], expected, `fixture ${i}`)
  assert.ok(cases.some(({ expected }) => expected.length > 100) && cases.some(({ expected }) => expected.length === 0) && cases.some(({ expected }) => expected.length === 1 || expected.length > 1 && expected.length < 20))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => Array.from(operation(input))))
export const consume = (value) => value.length
