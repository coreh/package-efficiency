import { strict as assert } from 'node:assert'
// Deterministic PEM bundles: certificate chains, key files and mixed bundles.
// Payloads are pseudo-random bytes (an LCG), so only real base64 decoding of
// the right block yields the expected bytes.
let seed = 12345
const bytes = (n) => Buffer.from(Array.from({ length: n }, () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0, seed >>> 16 & 255)))
const kinds = [
  ['CERTIFICATE', 700, 900],
  ['CERTIFICATE', 1100, 700],
  ['PRIVATE KEY', 1218, 0],
  ['RSA PRIVATE KEY', 1190, 500],
  ['EC PRIVATE KEY', 121, 0],
  ['PUBLIC KEY', 294, 0],
]
const wrap = (b64, nl) => b64.match(/.{1,64}/g).join(nl)
const build = (i) => {
  const nl = i % 4 === 3 ? '\r\n' : '\n'
  const count = 1 + (i * 7) % 12 + (i % 10 === 9 ? 25 : 0)
  const blocks = []
  let text = i % 3 === 0 ? `# bundle ${i}${nl}${nl}` : ''
  for (let k = 0; k < count; k++) {
    const [label, base, spread] = kinds[(i + k * (i % 2 ? 1 : 5)) % (i % 5 === 0 ? 2 : kinds.length)]
    const data = bytes(base + (spread ? (i * 131 + k * 17) % spread : 0))
    blocks.push({ label, data: data.toString('base64') })
    if (i % 2 === 0) text += `subject=/CN=host-${i}-${k}.example.org${nl}`
    text += `-----BEGIN ${label}-----${nl}${wrap(data.toString('base64'), nl)}${nl}-----END ${label}-----${nl}`
    if (k % 3 === 2) text += nl
  }
  return { input: text, expected: blocks }
}
export const cases = Array.from({ length: 40 }, (_, i) => build(i))
// Output: list of { label, data } where data is the payload as standard base64.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out), `fixture ${i}: list required`)
    assert.equal(out.length, expected.length, `fixture ${i}: block count`)
    for (const [k, e] of expected.entries()) {
      assert.equal(out[k].label, e.label, `fixture ${i} block ${k}: label`)
      assert.equal(out[k].data, e.data, `fixture ${i} block ${k}: payload`)
    }
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
