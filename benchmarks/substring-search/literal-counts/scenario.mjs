import { strict as assert } from 'node:assert'
let seed = 12345
const rnd = (n) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed >>> 8) % n }
const vocab = {
  log: ['INFO', 'WARN', 'ERROR', 'request', 'handled', 'timeout', 'user', 'session', 'cache', 'miss', 'hit', 'GET', 'POST', '/api/v1/items', '200', '404', '500', 'latency=12ms', 'retrying', 'connection', 'closed', 'worker-3'],
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
const oracle = (text, needle) => { let n = 0; for (let i = 0; i + needle.length <= text.length; i++) if (text.startsWith(needle, i)) n++; return n }
const sets = {
  log: ['ERROR', 'WARN', 'timeout', 'latency=', 'cache miss', '404', '500', 'retrying', 'worker-', 'GET /', 'POST', 'closed', 'session', 'handled', 'INFO', 'miss', 'cache', 'user', 'connection', '/api/v1'],
  prose: ['the', 'he', 'she', 'where', 'there', 'then', 'committee', 'river', 'storm', 'letter', 'morning', 'quietly', 'walked', 'home', 'hills', 'with', 'them', 'over', 'and', 'of'],
  header: ['Content-Type', 'Content-Length', 'Accept', 'application/json', 'text/html', 'gzip', 'keep-alive', 'Host:', 'User-Agent', 'Cache-Control', 'no-cache', 'max-age=0', 'Set-Cookie', 'Origin', 'Content', 'json', 'age', 'e', 'application', 'zzzz-absent']
}
const single12 = { log: 'latency=12ms', prose: 'storm letter', header: 'Content-Type' }
export const cases = []
for (let i = 0; i < 48; i++) {
  const kind = kinds[i % 3]
  const size = [1000, 2500, 6000, 16000, 32000, 48000][Math.floor(i / 3) % 6]
  const text = makeText(kind, size)
  let needles
  if (i % 4 === 0) needles = [['e', 'a', ' ', '\n', '/', 'E'][rnd(6)]]
  else if (i % 4 === 1) needles = [single12[kind]]
  else { const pool = sets[kind]; const count = [5, 10, 20, 40][rnd(4)]; needles = Array.from({ length: count }, (_, j) => pool[(j * 7 + i) % pool.length]); needles = [...new Set(needles)] }
  needles = needles.filter((n) => !hasSelfOverlap(n))
  if (needles.length === 0) needles = ['q']
  cases.push({ input: { text, needles }, expected: needles.map((n) => oracle(text, n)) })
}
for (const c of cases) assert.ok(c.input.needles.every((n) => n.length > 0 && !hasSelfOverlap(n)))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepEqual(outputs[i], expected, `fixture ${i}`)
  assert.ok(cases.some(({ expected }) => expected.some((n) => n > 0)) && cases.some(({ expected }) => expected.includes(0)))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => Array.from(operation(input))))
export const consume = (value) => value.length
