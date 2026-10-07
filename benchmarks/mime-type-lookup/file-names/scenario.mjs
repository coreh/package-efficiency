import { strict as assert } from 'node:assert'
const types = { html: 'text/html', htm: 'text/html', css: 'text/css', json: 'application/json', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', pdf: 'application/pdf', wasm: 'application/wasm', webp: 'image/webp', avif: 'image/avif' }
const exts = Object.keys(types)
const stems = ['index', 'assets/Photo.final', 'report-2026', '/var/www/site/main', 'a.b.c.d', 'My File (1)', 'static/img/hero_banner@2x', 'x']
const forms = [(e) => e, (e) => e, (e) => e.toUpperCase(), (e) => e[0].toUpperCase() + e.slice(1)]
export const cases = []
for (let i = 0; i < 78; i++) {
  const ext = exts[i % exts.length]
  const input = `${stems[(i * 3 + (i >> 3)) % stems.length]}${i}.${forms[i % 4](ext)}`
  cases.push({ input, expected: types[ext] })
}
const clean = (s) => s.split(';')[0].trim().toLowerCase()
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i} (${input}): string output required`)
    assert.equal(clean(outputs[i]), expected, `fixture ${i} (${input})`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
