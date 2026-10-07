import { strict as assert } from 'node:assert'
import { createECDH } from 'node:crypto'
// Deterministic DER builder. A node is { cls, tag, kids } (constructed) or { cls, tag, bytes } (primitive).
let seed = 777
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
const len = (n) => n < 128 ? [n] : n < 256 ? [0x81, n] : [0x82, n >> 8, n & 255]
const encode = (node) => {
  const body = node.kids ? node.kids.flatMap(encode) : node.bytes
  const id = (node.cls << 6) | (node.kids ? 0x20 : 0) | node.tag
  return [id, ...len(body.length), ...body]
}
const octets = (node) => prim(4, encode(node))
const ia5 = (s) => [...Buffer.from(s, 'ascii')]
const algs = [['1.2.840.113549.1.1.11', true], ['1.2.840.10045.4.3.2', false], ['1.3.101.112', false], ['1.2.840.113549.1.1.12', true]]
const sigAlg = (i) => { const [o, nul] = algs[i % algs.length]; return nul ? seq(oid(o), prim(5, [])) : seq(oid(o)) }
const attrs = [['2.5.4.6', 'C'], ['2.5.4.8', 'ST'], ['2.5.4.7', 'L'], ['2.5.4.10', 'O'], ['2.5.4.11', 'OU'], ['2.5.4.3', 'CN'], ['1.2.840.113549.1.9.1', 'E']]
const words = ['Example', 'Corp', 'São Paulo', 'Zürich', 'Test CA', 'Root', 'Secure', 'Web', 'Ünïcode 日本', 'Servers']
// Returns { node, cn, count }. Each name holds at most one common name.
const name = (i, count) => {
  let cn = ''
  const rdns = Array.from({ length: count }, (_, j) => {
    const [o, kind] = attrs[(i + j) % attrs.length]
    let tag = 12
    let text
    if (kind === 'C') { tag = 19; text = ['US', 'BR', 'DE', 'JP'][(i + j) % 4] }
    else if (kind === 'E') { tag = 22; text = `admin${i}@example.com` }
    else {
      text = `${words[(i * 3 + j) % words.length]} ${i}`
      if (/^[\x20-\x7e]*$/.test(text) && (i + j) % 2 === 0) tag = 19
    }
    if (kind === 'CN') cn = text
    return set(seq(oid(o), str(tag, text)))
  })
  return { node: seq(...rdns), cn, count }
}
const two = (n) => String(n).padStart(2, '0')
const time = (y, i) => {
  const [mo, d, h, mi, s] = [1 + i % 12, 1 + i % 28, i % 24, (i * 7) % 60, (i * 13) % 60]
  const text = `${y}${two(mo)}${two(d)}${two(h)}${two(mi)}${two(s)}Z`
  const node = y < 2050 ? str(23, text.slice(2)) : str(24, text)
  return { node, unix: Date.UTC(y, mo - 1, d, h, mi, s) / 1000 }
}
const exts = (i) => {
  const host = `h${i}.example.com`
  const list = [
    seq(oid('2.5.29.19'), prim(1, [255]), octets(seq(prim(1, [255])))),
    seq(oid('2.5.29.15'), prim(1, [255]), prim(4, [0x03, 0x02, 0x05, 0xa0])),
    seq(oid('2.5.29.14'), prim(4, [0x04, 0x14, ...randBytes(20)])),
    seq(oid('2.5.29.35'), prim(4, [0x30, 0x16, 0x80, 0x14, ...randBytes(20)])),
    seq(oid('2.5.29.17'), octets(seq(prim(2, ia5(host), 2), prim(2, ia5(`www.${host}`), 2)))),
    seq(oid('2.5.29.37'), octets(seq(oid('1.3.6.1.5.5.7.3.1'), oid('1.3.6.1.5.5.7.3.2')))),
    seq(oid('1.3.6.1.5.5.7.1.1'), octets(seq(seq(oid('1.3.6.1.5.5.7.48.1'), prim(6, ia5(`http://ocsp${i}.example.com`), 2))))),
    seq(oid('2.5.29.31'), octets(seq(seq(ctx(0, ctx(0, prim(6, ia5(`http://crl${i}.example.com/ca.crl`), 2))))))),
  ]
  // 7 of 8 listed, in this order, so 1..7 extensions
  return list.slice(0, 1 + i % 7)
}
const bigInt = (bytes) => int(bytes[0] & 128 ? [0, ...bytes] : bytes)
const spki = (i) => {
  const kind = i % 3
  if (kind === 0) {
    const n = randBytes(256); n[0] |= 192; n[255] |= 1
    return seq(seq(oid('1.2.840.113549.1.1.1'), prim(5, [])), bits(encode(seq(bigInt(n), int([1, 0, 1])))))
  }
  if (kind === 1) {
    const ecdh = createECDH('prime256v1')
    ecdh.setPrivateKey(Buffer.from([1, ...randBytes(31)]))
    return seq(seq(oid('1.2.840.10045.2.1'), oid('1.2.840.10045.3.1.7')), bits([...ecdh.getPublicKey()]))
  }
  return seq(seq(oid('1.3.101.112')), bits(randBytes(32)))
}
const cert = (i) => {
  const serialBytes = [16 + (rnd() % 100), ...randBytes(7 + i % 12)]
  const subject = name(i, 1 + i % 6)
  const issuer = name(i + 5, 1 + (i * 5) % 6)
  const nb = time(1990 + i % 40, i)
  const na = time(i % 4 === 0 ? 2050 + i % 9 : 2030 + i % 19, i + 3)
  const nExt = 1 + i % 7
  const tbs = seq(ctx(0, int([2])), int(serialBytes), sigAlg(i), issuer.node, seq(nb.node, na.node), subject.node, spki(i), ctx(3, seq(...exts(i))))
  const sigLen = i % 3 === 0 ? 256 : 64
  const der = seq(tbs, sigAlg(i), bits(randBytes(sigLen)))
  return {
    input: Buffer.from(encode(der)).toString('hex'),
    expected: {
      version: 3,
      serial: Buffer.from(serialBytes).toString('hex'),
      subjectCN: subject.cn,
      issuerCN: issuer.cn,
      subjectAttrs: subject.count,
      issuerAttrs: issuer.count,
      notBefore: nb.unix,
      notAfter: na.unix,
      extensions: nExt,
    },
  }
}
export const cases = Array.from({ length: 40 }, (_, i) => cert(i))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.deepStrictEqual({ ...outputs[i] }, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.extensions
