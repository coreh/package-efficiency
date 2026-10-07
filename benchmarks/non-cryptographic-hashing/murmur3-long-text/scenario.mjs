import { strict as assert } from 'node:assert'
// Independent reference: MurmurHash3 x86 32-bit, seed 0, over ASCII bytes.
const imul = Math.imul
const reference = (s) => {
  const n = s.length, blocks = n & ~3
  let h = 0, i = 0
  for (; i < blocks; i += 4) {
    let k = s.charCodeAt(i) | (s.charCodeAt(i + 1) << 8) | (s.charCodeAt(i + 2) << 16) | (s.charCodeAt(i + 3) << 24)
    k = imul(k, 0xcc9e2d51); k = (k << 15) | (k >>> 17); k = imul(k, 0x1b873593)
    h ^= k; h = (h << 13) | (h >>> 19); h = (imul(h, 5) + 0xe6546b64) | 0
  }
  let k = 0
  switch (n & 3) {
    case 3: k ^= s.charCodeAt(i + 2) << 16
    case 2: k ^= s.charCodeAt(i + 1) << 8
    case 1: k ^= s.charCodeAt(i); k = imul(k, 0xcc9e2d51); k = (k << 15) | (k >>> 17); k = imul(k, 0x1b873593); h ^= k
  }
  h ^= n
  h ^= h >>> 16; h = imul(h, 0x85ebca6b); h ^= h >>> 13; h = imul(h, 0xc2b2ae35); h ^= h >>> 16
  return h >>> 0
}
assert.equal(reference(''), 0)
assert.equal(reference('hello'), 0x248bfa47)
assert.equal(reference('The quick brown fox jumps over the lazy dog'), 0x2e4ff723)
const words = ['alpha', 'request', 'handler', 'buffer', 'stream', 'cluster', 'latency', 'payload', 'schema', 'token', 'render', 'commit']
const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG']
let seed = 12345
const rnd = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296
const line = (kind, j) => {
  switch (kind) {
    case 0: return `${words[(j * 7) % 12]} ${words[(j * 5 + 3) % 12]} ${words[(j * 11 + 1) % 12]} ${j}. `
    case 1: return `2026-10-${String(1 + (j % 28)).padStart(2, '0')}T${String(j % 24).padStart(2, '0')}:${String((j * 7) % 60).padStart(2, '0')}:00Z ${levels[j % 4]} [${words[j % 12]}] took ${Math.floor(rnd() * 5000)}ms\n`
    case 2: return `{"id":${j},"name":"${words[j % 12]}-${Math.floor(rnd() * 99999)}","tags":["${words[(j + 1) % 12]}","${words[(j + 2) % 12]}"],"ok":${j % 3 === 0}},`
    default: { let s = ''; for (let q = 0; q < 16; q++) s += Math.floor(rnd() * 256).toString(16).padStart(2, '0'); return s + '\n' }
  }
}
const sizes = [1024, 1500, 2049, 3000, 4096, 5001, 8192, 10000, 16383, 20000, 32768, 40001, 65536, 100000, 131072, 200003, 262144]
const docs = []
for (let i = 0; i < 36; i++) {
  const size = sizes[(i * 5) % sizes.length] + (i % 4) - (i < 4 ? 0 : 0)
  const kind = i % 4
  let s = '', j = 0
  while (s.length < size) s += line(kind, j++)
  docs.push(s.slice(0, Math.max(1024, size)))
}
export const cases = docs.map((input) => ({ input, expected: reference(input) }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'number', `fixture ${i}: number output required`)
    assert.equal(outputs[i] >>> 0, expected, `fixture ${i}`)
  }
  assert.ok(new Set(outputs).size > cases.length - 3, 'results must differ per input')
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value & 0xffff
