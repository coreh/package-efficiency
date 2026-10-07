import { strict as assert } from 'node:assert'
const regions = ['eu-west', 'us-east', 'ap-south', 'sa-east']
const suffixes = ['alpha', 'beta', 'café', '日本語', 'naïve']
// Builds one .env text and the map a correct parser returns once every
// ${NAME} reference is expanded. References only name earlier keys of the same
// text, never the process environment, and only appear in unquoted values
// (@std/dotenv does not expand inside double quotes; libraries disagree on
// single quotes).
const build = (n, groups) => {
  const lines = [`# Settings for deployment ${n}`, '']
  const expected = {}
  const add = (key, raw, value, comment = '') => { lines.push(`${key}=${raw}${comment}`); expected[key] = value }
  const region = regions[n % regions.length]
  add('XENV_ROOT', `/srv/app-${n}`, `/srv/app-${n}`)
  add('XENV_REGION', `"${region}"`, region)
  for (let g = 0; g < groups; g++) {
    const host = `svc${g}.${region}.example.com`
    const port = String(8000 + ((n * 31 + g * 7) % 900))
    const suf = suffixes[(n + g) % suffixes.length]
    lines.push(`# service ${g}`)
    add(`SVC${g}_HOST`, host, host)
    add(`SVC${g}_PORT`, port, port)
    add(`SVC${g}_ADDR`, `\${SVC${g}_HOST}:\${SVC${g}_PORT}`, `${host}:${port}`)
    add(`SVC${g}_URL`, `https://\${SVC${g}_ADDR}/v1/${suf}`, `https://${host}:${port}/v1/${suf}`)
    add(`SVC${g}_DIR`, `\${XENV_ROOT}/${suf}/svc${g}`, `/srv/app-${n}/${suf}/svc${g}`)
    add(`SVC${g}_LOG`, `\${SVC${g}_DIR}/logs/\${XENV_REGION}.log`, `/srv/app-${n}/${suf}/svc${g}/logs/${region}.log`)
    if (g % 2 === 0) add(`SVC${g}_LABEL`, `\${XENV_REGION}-${g}`, `${region}-${g}`, ' # trailing comment')
    if (g % 3 === 0) add(`SVC${g}_PLAIN`, `"no references, just text # ${suf}"`, `no references, just text # ${suf}`)
    if (g % 4 === 1) { lines.push(''); add(`SVC${g}_NAME`, `\${SVC${g}_HOST}_\${XENV_REGION}`, `${host}_${region}`) }
  }
  return { text: lines.join('\n') + '\n', expected }
}
const make = (n) => { const { text, expected } = build(n, n === 35 ? 40 : 1 + (n * 5) % 11); return { input: text, expected } }
export const cases = Array.from({ length: 36 }, (_, i) => make(i))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(out !== null && typeof out === 'object' && !Array.isArray(out), `fixture ${i}: map required`)
    const got = Object.fromEntries(Object.entries(out))
    assert.deepStrictEqual(got, expected, `fixture ${i}`)
    for (const v of Object.values(got)) assert.ok(!v.includes('${'), `fixture ${i}: unexpanded reference`)
    assert.ok(input.includes('${'), 'fixture has references')
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.XENV_ROOT.length
