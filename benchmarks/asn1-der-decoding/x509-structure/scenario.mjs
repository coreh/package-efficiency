import { strict as assert } from 'node:assert'
// Deterministic DER builder. A node is { cls, tag, kids } (constructed) or { cls, tag, bytes } (primitive).
let seed = 12345
const rnd = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) >>> 8
const randBytes = (n) => Array.from({ length: n }, () => rnd() & 255)
const prim = (tag, bytes, cls = 0) => ({ cls, tag, bytes })
const cons = (tag, kids, cls = 0) => ({ cls, tag, kids })
const seq = (...k) => cons(16, k)
const set = (...k) => cons(17, k)
const ctx = (n, ...k) => cons(n, k, 2)
const int = (bytes) => prim(2, bytes)
const str = (tag, s) => prim(tag, [...Buffer.from(s, 'utf8')])
const oid = (dotted) => {
  const p = dotted.split('.').map(Number)
  const out = []
  for (const n of [p[0] * 40 + p[1], ...p.slice(2)]) {
    const parts = [n & 127]
    for (let v = n >> 7; v > 0; v >>= 7) parts.unshift((v & 127) | 128)
    out.push(...parts)
  }
  return prim(6, out)
}
const bits = (bytes) => prim(3, [0, ...bytes])
const octets = (bytes) => prim(4, bytes)
const len = (n) => n < 128 ? [n] : n < 256 ? [0x81, n] : [0x82, n >> 8, n & 255]
const encode = (node) => {
  const body = node.kids ? node.kids.flatMap(encode) : node.bytes
  const id = (node.cls << 6) | (node.kids ? 0x20 : 0) | node.tag
  return [id, ...len(body.length), ...body]
}
const flatten = (node, out) => {
  out.push(node.cls * 100 + node.tag)
  if (node.kids) for (const k of node.kids) flatten(k, out)
  return out
}
const algs = [['1.2.840.113549.1.1.11', true], ['1.2.840.10045.4.3.2', false], ['1.3.101.112', false], ['1.2.840.113549.1.1.12', true]]
const sigAlg = (i) => { const [o, nul] = algs[i % algs.length]; return nul ? seq(oid(o), prim(5, [])) : seq(oid(o)) }
const attrs = [['2.5.4.6', 19], ['2.5.4.8', 12], ['2.5.4.7', 12], ['2.5.4.10', 12], ['2.5.4.11', 12], ['2.5.4.3', 12], ['1.2.840.113549.1.9.1', 22]]
const words = ['Example', 'Corp', 'São Paulo', 'Zürich', 'Test CA', 'Root', 'Secure', 'Web', 'Ünïcode 日本', 'Servers']
const name = (i, count) => seq(...Array.from({ length: count }, (_, j) => {
  const [o, tag] = attrs[(i + j) % attrs.length]
  const text = tag === 19 ? ['US', 'BR', 'DE', 'JP'][(i + j) % 4] : tag === 22 ? `admin${i}@example.com` : `${words[(i * 3 + j) % words.length]} ${i}`
  return set(seq(oid(o), str(tag === 12 && /[^\x00-\x7f]/.test(text) ? 12 : tag === 12 ? 12 : tag, text)))
}))
const two = (n) => String(n).padStart(2, '0')
const utc = (y, i) => str(23, `${two(y % 100)}${two(1 + i % 12)}${two(1 + i % 28)}${two(i % 24)}${two(i % 60)}00Z`)
const gen = (y, i) => str(24, `${y}${two(1 + i % 12)}${two(1 + i % 28)}${two(i % 24)}${two(i % 60)}00Z`)
const exts = (i) => {
  const list = [
    seq(oid('2.5.29.19'), prim(1, [255]), octets([0x30, 0x03, 0x01, 0x01, 0xff])),
    seq(oid('2.5.29.15'), prim(1, [255]), octets([0x03, 0x02, 0x05, 0xa0])),
    seq(oid('2.5.29.14'), octets([0x04, 0x14, ...randBytes(20)])),
    seq(oid('2.5.29.35'), octets([0x30, 0x16, 0x80, 0x14, ...randBytes(20)])),
    seq(oid('2.5.29.17'), octets([0x30, 0x0e, 0x82, 0x0c, ...[...Buffer.from(`h${i}.example`)].slice(0, 12).concat(Array(12).fill(46)).slice(0, 12)])),
    seq(oid('2.5.29.37'), octets([0x30, 0x0a, 0x06, 0x08, 0x2b, 0x06, 0x01, 0x05, 0x05, 0x07, 0x03, 0x01])),
    seq(oid('1.3.6.1.5.5.7.1.1'), octets(randBytes(40 + i * 7 % 90))),
    seq(oid('2.5.29.31'), octets(randBytes(30 + i * 11 % 60))),
  ]
  return list.slice(0, 2 + i % 7)
}
const spki = (i) => {
  const kind = i % 3
  if (kind === 0) return seq(seq(oid('1.2.840.113549.1.1.1'), prim(5, [])), bits([0x30, 0x82, 0x01, 0x0a, 0x02, 0x82, 0x01, 0x01, 0, ...randBytes(256), 0x02, 0x03, 1, 0, 1]))
  if (kind === 1) return seq(seq(oid('1.2.840.10045.2.1'), oid('1.2.840.10045.3.1.7')), bits([4, ...randBytes(64)]))
  return seq(seq(oid('1.3.101.112')), bits(randBytes(32)))
}
const cert = (i) => {
  const serial = int([1 + (rnd() % 100), ...randBytes(7 + i % 14)])
  const tbsKids = []
  if (i % 8 !== 7) tbsKids.push(ctx(0, int([2])))
  tbsKids.push(serial, sigAlg(i), name(i, 2 + i % 5), seq(utc(2020 + i % 20, i), i % 4 === 0 ? gen(2050 + i % 9, i) : utc(2030 + i % 19, i + 3)), name(i + 5, 1 + i % 6), spki(i))
  if (i % 8 !== 7) tbsKids.push(ctx(3, seq(...exts(i))))
  const sigLen = i % 3 === 0 ? 256 : 64
  return seq(seq(...tbsKids), sigAlg(i), bits(randBytes(sigLen)))
}
const trees = Array.from({ length: 40 }, (_, i) => cert(i))
export const cases = trees.map((t) => ({ input: Buffer.from(encode(t)).toString('hex'), expected: flatten(t, []) }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out), `fixture ${i}: list required`)
    assert.deepStrictEqual(Array.from(out, Number), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length
