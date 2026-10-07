import { strict as assert } from 'node:assert'
// Independent RFC 3492 encoder, used only to build expected outputs.
const encodeLabel = (label) => {
  const cps = Array.from(label, (c) => c.codePointAt(0))
  if (cps.every((c) => c < 128)) return label
  const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700
  const digit = (d) => String.fromCharCode(d < 26 ? d + 97 : d + 22)
  const adapt = (delta, n, first) => {
    delta = first ? Math.floor(delta / damp) : delta >> 1
    delta += Math.floor(delta / n)
    let k = 0
    while (delta > ((base - tMin) * tMax) >> 1) { delta = Math.floor(delta / (base - tMin)); k += base }
    return k + Math.floor(((base - tMin + 1) * delta) / (delta + skew))
  }
  const basic = cps.filter((c) => c < 128)
  let out = String.fromCharCode(...basic)
  let h = basic.length
  const b = h
  if (b) out += '-'
  let n = 128, delta = 0, bias = 72
  while (h < cps.length) {
    const m = Math.min(...cps.filter((c) => c >= n))
    delta += (m - n) * (h + 1)
    n = m
    for (const c of cps) {
      if (c < n) delta++
      if (c === n) {
        let q = delta
        for (let k = base; ; k += base) {
          const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias
          if (q < t) break
          out += digit(t + ((q - t) % (base - t)))
          q = Math.floor((q - t) / (base - t))
        }
        out += digit(q)
        bias = adapt(delta, h + 1, h === b)
        delta = 0
        h++
      }
    }
    delta++; n++
  }
  return 'xn--' + out
}
const toAscii = (d) => d.split('.').map(encodeLabel).join('.')
const labels = ['bücher', 'münchen', 'café', 'strasse-frei', 'señor', '日本語', '例え', 'テスト', 'ドメイン名', '中文', '北京大学', '한국어', '도메인', 'пример', 'президент', 'παράδειγμα', 'ελλάδα', 'ไทย', 'उदाहरण', 'مثال', 'räksmörgås', 'ñandú', 'smörgåsbord', 'naïve', 'zürich', 'københavn']
const ascii = ['example', 'shop', 'mail', 'www', 'my-site', 'blog2', 'api', 'cdn-eu']
const tlds = ['com', 'org', 'net', 'de', 'jp', 'br', 'info', 'io']
const names = []
for (let i = 0; i < 54; i++) {
  const l = labels[i % labels.length]
  const parts = []
  if (i % 3 === 1) parts.push(ascii[i % ascii.length])
  if (i % 4 === 2) parts.push(labels[(i * 7 + 3) % labels.length].replace(/^مثال$/, 'beispiel'))
  parts.push(l)
  if (i % 5 === 4) parts.push(ascii[(i + 3) % ascii.length])
  parts.push(tlds[i % tlds.length])
  names.push(parts.join('.'))
}
names.push('example.com', 'sub.domain.example.org', 'a.b.c.d.example', '例え.テスト', 'zürich.ch')
export const cases = names.map((input) => ({ input, expected: [toAscii(input), input] }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out) && out.length === 2, `fixture ${i}: [ascii, unicode] required`)
    assert.deepStrictEqual(out, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value[0].length + value[1].length
