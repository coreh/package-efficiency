import { strict as assert } from 'node:assert'
// Input: { id, aa, rd, ra, question: { name, type }, answers: [{ name, ttl, type, data }] }
//   type is one of A, AAAA, CNAME, MX, TXT. data is an address string (A, AAAA), a
//   fully qualified name (CNAME), { preference, exchange } (MX) or an array of strings (TXT).
//   Names are lower-case ASCII with a trailing dot.
// Output: the wire-format message as bytes (a byte string in Ruby, Vec<u8> in Rust).
// Compression of repeated names is the library's choice; the check decodes the wire
// bytes with its own decoder (following compression pointers) and compares the content.
const TYPES = { A: 1, AAAA: 28, CNAME: 5, MX: 15, TXT: 16 }
const zones = ['example.com.', 'mail.example.org.', 'shop.example.co.uk.', 'cdn.service.example.net.', 'a.b.c.d.example.io.', 'x.test.', 'very-long-subdomain-name-for-testing.deep.internal.example.dev.']
const hosts = ['www', 'api', 'mx1', 'mx2', 'static', 'edge-3', 'blog', 'ns', 'img', 'login']
const txts = [
  ['v=spf1 include:_spf.example.com ~all'],
  ['google-site-verification=abcdefghijklmnopqrstuvwxyz0123456789'],
  ['hello', 'world'],
  ['v=DKIM1; k=rsa; p=' + 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC'.repeat(5)],
  [''],
  ['a'.repeat(200), 'tail'],
  ['key=value', 'other=thing with spaces', 'x'],
]
const hex = (n, k) => ((n * 2654435761 + k * 40503) >>> 0) % 65536
const build = (i) => {
  const zone = zones[i % zones.length]
  const qname = (i % 3 === 0 ? '' : hosts[i % hosts.length] + '.') + zone
  const count = [1, 10, 10, 3, 10, 6, 12, 10][i % 8]
  const answers = []
  for (let k = 0; k < count; k++) {
    const t = ['A', 'AAAA', 'CNAME', 'MX', 'TXT'][(i + k * 2 + (k >> 2)) % 5]
    const owner = k % 3 === 2 ? hosts[(i + k) % hosts.length] + '.' + zone : qname
    let data
    if (t === 'A') data = `${(i * 7 + k * 13) % 223 + 1}.${(i + k) % 256}.${(i * 3 + k * 5) % 256}.${(k * 17 + 1) % 255 + 1}`
    else if (t === 'AAAA') data = `2001:db8:${hex(i, k).toString(16)}::${hex(k, i).toString(16)}:${(k + 1).toString(16)}`
    else if (t === 'CNAME') data = hosts[(i * 3 + k) % hosts.length] + '.' + zones[(i + k + 1) % zones.length]
    else if (t === 'MX') data = { preference: (k * 10 + i % 4 * 5) % 65535, exchange: 'mx' + (k % 3) + '.' + zones[(i + k) % zones.length] }
    else data = txts[(i + k) % txts.length]
    answers.push({ name: owner, ttl: [60, 300, 3600, 86400, 0, 4294967][(i + k) % 6], type: t, data })
  }
  return { id: (i * 4099 + 17) % 65536, aa: i % 2 === 0, rd: i % 3 !== 1, ra: i % 4 !== 3, question: { name: qname, type: ['A', 'AAAA', 'MX', 'TXT', 'CNAME'][i % 5] }, answers }
}
export const cases = Array.from({ length: 40 }, (_, i) => ({ input: build(i) }))

const decode = (bytes) => {
  const u8 = (p) => bytes[p]
  const u16 = (p) => (bytes[p] << 8) | bytes[p + 1]
  const u32 = (p) => ((bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3]) >>> 0
  const name = (p) => {
    const labels = []
    let end = -1, hops = 0
    for (;;) {
      const len = u8(p)
      assert.ok(len !== undefined, 'name runs past the end')
      if (len === 0) { p++; break }
      if ((len & 0xc0) === 0xc0) {
        if (end < 0) end = p + 2
        p = ((len & 0x3f) << 8) | u8(p + 1)
        assert.ok(++hops < 64, 'compression loop')
        continue
      }
      assert.ok(len < 64, 'bad label length')
      labels.push(String.fromCharCode(...bytes.slice(p + 1, p + 1 + len)).toLowerCase())
      p += 1 + len
    }
    return [labels.length ? labels.join('.') + '.' : '.', end < 0 ? p : end]
  }
  assert.ok(bytes.length >= 12, 'header required')
  const flags = u16(2)
  const out = { id: u16(0), qr: flags >> 15, opcode: (flags >> 11) & 15, aa: (flags >> 10) & 1, tc: (flags >> 9) & 1, rd: (flags >> 8) & 1, ra: (flags >> 7) & 1, z: (flags >> 4) & 7, rcode: flags & 15, questions: [], answers: [] }
  const [qd, an, ns, ar] = [u16(4), u16(6), u16(8), u16(10)]
  assert.deepEqual([ns, ar], [0, 0], 'no authority or additional records')
  let p = 12
  for (let q = 0; q < qd; q++) {
    const [n, np] = name(p)
    out.questions.push({ name: n, type: u16(np), class: u16(np + 2) })
    p = np + 4
  }
  const byType = Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [v, k]))
  for (let a = 0; a < an; a++) {
    const [n, np] = name(p)
    const type = u16(np), cls = u16(np + 2), ttl = u32(np + 4), rdlen = u16(np + 8)
    const r = np + 10
    const t = byType[type]
    assert.ok(t, `unexpected type ${type}`)
    let data
    if (t === 'A') { assert.equal(rdlen, 4); data = [...bytes.slice(r, r + 4)].join('.') }
    else if (t === 'AAAA') { assert.equal(rdlen, 16); data = Array.from({ length: 8 }, (_, g) => u16(r + g * 2)) }
    else if (t === 'CNAME') data = name(r)[0]
    else if (t === 'MX') data = { preference: u16(r), exchange: name(r + 2)[0] }
    else {
      data = []
      for (let q = r; q < r + rdlen;) { const l = u8(q); data.push(String.fromCharCode(...bytes.slice(q + 1, q + 1 + l))); q += 1 + l; assert.ok(q <= r + rdlen) }
    }
    out.answers.push({ name: n, type: t, class: cls, ttl, data })
    p = r + rdlen
  }
  assert.equal(p, bytes.length, 'trailing bytes')
  return out
}
const groups = (addr) => {
  const [head, tail = ''] = addr.split('::')
  const h = head ? head.split(':') : [], t = tail ? tail.split(':') : []
  return [...h, ...Array(8 - h.length - t.length).fill('0'), ...t].map((g) => parseInt(g, 16))
}
const expectedOf = (input) => ({
  id: input.id, qr: 1, opcode: 0, aa: +input.aa, tc: 0, rd: +input.rd, ra: +input.ra, z: 0, rcode: 0,
  questions: [{ name: input.question.name, type: TYPES[input.question.type], class: 1 }],
  answers: input.answers.map((a) => ({ name: a.name, type: a.type, class: 1, ttl: a.ttl, data: a.type === 'AAAA' ? groups(a.data) : a.data })),
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input }] of cases.entries()) {
    const bytes = outputs[i]
    assert.ok(Array.isArray(bytes) && bytes.every((b) => Number.isInteger(b) && b >= 0 && b < 256), `fixture ${i}: wire bytes required`)
    assert.deepEqual(decode(bytes), expectedOf(input), `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => {
  const r = operation(input)
  return typeof r === 'string' ? [...Buffer.from(r, 'latin1')] : [...r]
}))
export const consume = (value) => value.length
