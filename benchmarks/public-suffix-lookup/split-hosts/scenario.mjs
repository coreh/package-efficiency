import { strict as assert } from 'node:assert'
// Host names are built piece by piece, so the expected split is known:
//   host = [subdomain.]name.suffix
// and the common result is the registrable domain (name.suffix) as a string, or
// null when the host is only a public suffix (it has no registrable domain).
// Suffixes are ICANN-section rules that have been in the Public Suffix List
// for many years. No name is a private-section rule (github.io, blogspot.com)
// and no host is under a rule that is only in the private section, so a
// package that leaves the private section out and one that includes it agree.
// Every host is lower case, ASCII (IDN suffixes in punycode) and has a suffix
// the list knows, so the "unknown suffix" rule does not matter either.
const plain = [
  'com', 'net', 'org', 'edu', 'gov', 'info', 'biz', 'io', 'co', 'ai', 'dev', 'app', 'me', 'tv', 'xyz', 'online', 'shop', 'tech',
  'de', 'fr', 'nl', 'se', 'no', 'fi', 'es', 'it', 'pl', 'ch', 'at', 'be', 'dk', 'cz', 'pt', 'ie', 'gr', 'hu', 'ro', 'ua',
  'ru', 'jp', 'cn', 'in', 'kr', 'tw', 'hk', 'sg', 'br', 'ar', 'mx', 'au', 'nz', 'ca', 'us', 'uk', 'eu', 'tr', 'il',
]
const multi = [
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'nhs.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'id.au',
  'co.jp', 'ne.jp', 'or.jp', 'ac.jp', 'go.jp',
  'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br',
  'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn',
  'co.nz', 'org.nz', 'net.nz', 'co.za', 'org.za', 'co.in', 'net.in', 'org.in',
  'com.mx', 'com.ar', 'com.tr', 'com.tw', 'com.hk', 'com.sg', 'com.my', 'co.kr', 'or.kr', 'co.il', 'co.id', 'com.ua',
]
// Internationalized suffixes, as punycode.
const idn = ['xn--p1ai', 'xn--fiqs8s', 'xn--j6w193g', 'xn--90ae', 'xn--mgbaam7a8h']
// Wildcard rules (*.ck) and the exception to one (!www.ck).
const wildcard = ['ck', 'fk', 'jm', 'np', 'pg', 'mm']
const labels = ['acme', 'northwind', 'contoso', 'globex', 'initech', 'umbrella', 'hooli', 'vandelay', 'wayne', 'stark', 'tyrell', 'cyberdyne', 'soylent', 'wonka', 'oscorp', 'aperture']
const subs = ['www', 'mail', 'api', 'cdn', 'static', 'img', 'a', 'eu-west-1', 'staging', 'm', 'shop', 'docs']
const pick = (pool, i, k = 0) => pool[(i * 7 + k * 5 + ((i * i) >> 3)) % pool.length]

const build = (i, suffix) => {
  const name = `${pick(labels, i, 1)}${i % 3 === 0 ? '' : `-${i % 97}`}`
  const depth = i % 5 === 0 ? 0 : i % 5 === 1 ? 1 : i % 5 === 2 ? 2 : i % 5 === 3 ? 1 : 3
  const sub = Array.from({ length: depth }, (_, k) => pick(subs, i, k + 2)).join('.')
  const registrable = `${name}.${suffix}`
  const host = sub ? `${sub}.${registrable}` : registrable
  return { input: host, expected: registrable }
}
const makeCase = (i) => {
  const kind = i % 12
  if (kind === 0) {
    // A host that is only a suffix.
    const suffix = i % 24 === 0 ? pick(multi, i) : i % 36 === 12 ? pick(idn, i) : pick(plain, i)
    return { input: suffix, expected: null }
  }
  if (kind === 1) {
    // Under a wildcard rule: the suffix has one more label than the rule.
    const tld = pick(wildcard, i), mid = `${pick(labels, i, 3)}-${i % 11}`
    if (i % 24 === 1) return { input: `${mid}.${tld}`, expected: null }
    return build(i, `${mid}.${tld}`)
  }
  if (kind === 2) {
    // The exception to *.ck: www.ck is itself a registrable domain.
    const sub = i % 2 ? `${pick(subs, i)}.` : ''
    return { input: `${sub}www.ck`, expected: 'www.ck' }
  }
  if (kind === 3 || kind === 4) return build(i, pick(idn, i))
  if (kind <= 8) return build(i, pick(multi, i))
  return build(i, pick(plain, i))
}
export const cases = Array.from({ length: 720 }, (_, i) => {
  const { input, expected } = makeCase(i)
  return { input, expected }
})

export const verifyOne = (i, output) => {
  const { input, expected } = cases[i]
  if (typeof output === 'string' && output.startsWith('"')) output = JSON.parse(output)
  assert.equal(output ?? null, expected, `fixture ${i}: ${input}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (value === null || value === undefined ? 0 : value.length)
