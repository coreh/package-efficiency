import { strict as assert } from 'node:assert'
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo', 'naïve 😀', 'hello world']
const names = ['server', 'database', 'logging', 'cache', 'paths', 'ui theme', 'plugin.auth', 'plugin.mail', 'Élan', 'network', 'limits', 'queue']
const keys = ['host', 'port', 'name', 'path', 'url', 'mode', 'level', 'title', 'timeout', 'user', 'retries', 'label', 'root', 'token', 'format']
const value = (i, s, k) => {
  switch ((i + s + k) % 8) {
    case 0: return `/var/lib/app${i}/data-${s}-${k}`
    case 1: return `http://host${k}.example.com:${8000 + i}/path?a=${s}&b=${k}`
    case 2: return `${words[(i + k) % words.length]} ${words[(s + k) % words.length]}`
    case 3: return `v${i}.${s}.${k}-rc`
    case 4: return `name=${words[k % words.length]}`
    case 5: return `eu-west-${i}:${k}:${s}`
    case 6: return `${words[i % words.length]}`
    default: return `item ${k} of ${s} in doc ${i}`
  }
}
const build = (i) => {
  const sections = 2 + (i % 5) * (1 + (i % 7 === 0 ? 5 : 0))
  const lines = [i % 2 ? '; configuration generated for fixture ' + i : '# configuration for fixture ' + i, '']
  const expected = {}
  for (let s = 0; s < sections; s++) {
    const name = names[(i + s) % names.length] + (s >= names.length ? ` ${s}` : '')
    if (name in expected) continue
    const count = 3 + ((i * 3 + s) % 8) * (1 + (i % 5 === 0 ? 3 : 0))
    expected[name] = {}
    lines.push(`[${name}]`)
    for (let k = 0; k < count; k++) {
      const key = keys[k % keys.length] + (k >= keys.length ? `_${Math.floor(k / keys.length)}` : '')
      const v = value(i, s, k)
      expected[name][key] = v
      lines.push((i + k) % 3 === 0 ? `${key}=${v}` : `${key} = ${v}`)
      if (k % 6 === 5) lines.push(k % 12 === 5 ? '; a comment line' : '# another comment', '')
    }
    lines.push('')
  }
  return { input: lines.join('\n'), expected }
}
export const cases = Array.from({ length: 36 }, (_, i) => build(i))
const plain = (x) => x !== null && typeof x === 'object' && !Array.isArray(x) && Object.getPrototypeOf(x) === Object.prototype
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(plain(out), `fixture ${i}: plain object required`)
    for (const v of Object.values(out)) assert.ok(plain(v), `fixture ${i}: sections must be plain objects`)
    assert.deepStrictEqual(out, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
// The timed loop calls consume on every result, so it must not allocate:
// Object.keys would build an array per call, which only JavaScript would pay.
// Every non-empty fixture contains at least one of the names read here
// (asserted below), so the value depends on the result.
const has = (x) => x === undefined ? 0 : 1
export const consume = (value) => has(value.server) + has(value['plugin.auth']) + has(value.logging) + has(value['Élan']) + has(value.limits) + has(value.cache)
for (const [i, { expected }] of cases.entries()) assert.ok(consume(expected) > 0, `fixture ${i}: consume must read at least one section`)
