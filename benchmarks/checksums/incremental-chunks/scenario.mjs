import { strict as assert } from 'node:assert'
// Independent reference: bitwise CRC-32 (reflected polynomial 0xEDB88320, init and final xor 0xFFFFFFFF)
// over the concatenated UTF-8 bytes of all chunks.
const encoder = new TextEncoder()
const reference = (chunks) => {
  let crc = 0xffffffff
  for (const b of encoder.encode(chunks.join(''))) {
    crc ^= b
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
  }
  return (crc ^ 0xffffffff) >>> 0
}
assert.equal(reference([]), 0)
assert.equal(reference(['1234', '56789']), 0xcbf43926)
assert.equal(reference(['The quick brown fox ', '', 'jumps over the lazy dog']), 0x414fa339)
const prose = 'Efficiency is measured as CPU time and memory for the same job. Päckages wörk with ünïcode, 日本語 and 😀 too. '
const json = (i) => JSON.stringify({ id: i, name: `User ${i}`, tags: ['alpha', 'βeta'], nested: { scores: [i, i + 1, i / 3], city: 'São Paulo' } }) + '\n'
const log = (i) => `2026-10-06T12:${String(i % 60).padStart(2, '0')}:00Z INFO request id=${i * 7919} path=/api/v1/items/${i} status=200 bytes=${i * 313}\n`
const ascii = (n) => Array.from({ length: n }, (_, j) => String.fromCharCode(32 + ((j * 31 + (j >> 3) * 7) % 95))).join('')
const build = (kind, bytes) => {
  if (kind === 'ascii') return ascii(bytes)
  let s = ''
  for (let i = 0; s.length < bytes; i++) s += kind === 'log' ? log(i) : kind === 'json' ? json(i) : kind === 'prose' ? prose : ''
  return s.slice(0, bytes)
}
// Cut by code points so no chunk splits a surrogate pair.
const split = (text, size) => {
  const points = Array.from(text)
  const chunks = []
  for (let i = 0; i < points.length; i += size) chunks.push(points.slice(i, i + size).join(''))
  return chunks
}
const inputs = []
const kinds = ['log', 'json', 'ascii', 'prose']
const sizes = [1024, 4096, 16384, 65536]
const chunkSizes = [16, 64, 512, 1024, 4096]
for (const [ki, kind] of kinds.entries()) {
  for (const [si, bytes] of sizes.entries()) {
    const text = build(kind, bytes)
    inputs.push(split(text, chunkSizes[(ki + si) % 5]))
    if (bytes <= 16384) inputs.push(split(text, chunkSizes[(ki + si + 2) % 5]))
  }
}
// 4 kinds x (4 + 3) = 28 so far; add variety.
inputs.push(split(build('log', 4000), 4096)) // a single chunk
inputs.push(split(build('ascii', 4096), 4096))
for (let i = 0; i < 4; i++) inputs.push(split(build('log', 2048 + i * 700), 100 + i * 37))
inputs.push(['', 'abc', '', '', 'defghij', '', ''.padEnd(5, 'z'), ''])
inputs.push([''])
inputs.push(split(build('prose', 3000), 1).slice(0, 700))
inputs.push(split(build('json', 20000), 8))
inputs.push(split(build('ascii', 9000), 333))
inputs.push(split(build('json', 5000), 4000))
inputs.push(split('ÿ'.repeat(700), 29))
export const cases = inputs.map((input) => ({ input, expected: reference(input) }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'number', `fixture ${i}: number output required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value & 0xffff
