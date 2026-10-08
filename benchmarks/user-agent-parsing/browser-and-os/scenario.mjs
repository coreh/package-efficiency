import { strict as assert } from 'node:assert'
// Input: a User-Agent header string. Common result: { browser, version, os }
//   browser: the browser family as the library names it ("Chrome", "Mobile Safari", "edge-chromium")
//   version: the browser's version as the library gives it ("120.0.0.0", "17", 120); only the
//            part before the first "." is read
//   os:      the operating system family as the library names it ("Windows", "Mac OS", "OS X")
// The generator knows the truth for every string it writes: family, major version, OS family.
const win = ['10.0', '10.0', '6.1', '6.3']
const mac = ['10_15_7', '10_15_7', '11_6_8', '13_5', '14_2_1']
const num = (i, n, k) => (i * 31 + k * 17) % n
const templates = [
  // [family, os, minimum major, span, builder(v, i)]
  ['chrome', 'windows', 90, 40, (v, i) => `Mozilla/5.0 (Windows NT ${win[i % 4]}; ${i % 5 === 0 ? 'WOW64' : 'Win64; x64'}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.${4000 + num(i, 3000, 1)}.${num(i, 200, 2)} Safari/537.36`],
  ['edge', 'windows', 90, 40, (v, i) => `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.${4000 + num(i, 3000, 1)}.${num(i, 200, 2)} Safari/537.36 Edg/${v}.0.${1000 + num(i, 900, 3)}.${num(i, 90, 4)}`],
  ['firefox', 'windows', 90, 45, (v, i) => `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${v}.0) Gecko/20100101 Firefox/${v}.0`],
  ['opera', 'windows', 80, 40, (v, i) => `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v + 14}.0.${4000 + num(i, 3000, 1)}.${num(i, 200, 2)} Safari/537.36 OPR/${v}.0.${num(i, 5000, 5)}.${num(i, 90, 6)}`],
  ['chrome', 'macos', 90, 40, (v, i) => `Mozilla/5.0 (Macintosh; Intel Mac OS X ${mac[i % 5]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.${4000 + num(i, 3000, 1)}.${num(i, 200, 2)} Safari/537.36`],
  ['safari', 'macos', 14, 5, (v, i) => `Mozilla/5.0 (Macintosh; Intel Mac OS X ${mac[i % 5]}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${v}.${i % 7} Safari/605.1.15`],
  ['firefox', 'macos', 90, 45, (v, i) => `Mozilla/5.0 (Macintosh; Intel Mac OS X ${['10.15', '13.5', '14.2'][i % 3]}; rv:${v}.0) Gecko/20100101 Firefox/${v}.0`],
  ['edge', 'macos', 90, 40, (v, i) => `Mozilla/5.0 (Macintosh; Intel Mac OS X ${mac[i % 5]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.${4000 + num(i, 3000, 1)}.${num(i, 200, 2)} Safari/537.36 Edg/${v}.0.${1000 + num(i, 900, 3)}.${num(i, 90, 4)}`],
  ['chrome', 'linux', 90, 40, (v, i) => `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.${4000 + num(i, 3000, 1)}.${num(i, 200, 2)} Safari/537.36`],
  ['firefox', 'linux', 90, 45, (v, i) => `Mozilla/5.0 (X11; Linux ${i % 2 ? 'x86_64' : 'i686'}; rv:${v}.0) Gecko/20100101 Firefox/${v}.0`],
  ['chrome', 'android', 90, 40, (v, i) => `Mozilla/5.0 (Linux; Android ${10 + i % 5}; ${['Pixel 7', 'SM-G991B', 'moto g(60)', 'Pixel 6a', 'SM-A536E'][i % 5]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.${4000 + num(i, 3000, 1)}.${num(i, 200, 2)} Mobile Safari/537.36`],
  ['firefox', 'android', 90, 45, (v, i) => `Mozilla/5.0 (Android ${10 + i % 5}; Mobile; rv:${v}.0) Gecko/${v}.0 Firefox/${v}.0`],
  ['safari', 'ios', 14, 5, (v, i) => `Mozilla/5.0 (iPhone; CPU iPhone OS ${v}_${i % 6} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${v}.${i % 6} Mobile/15E148 Safari/604.1`],
]
export const cases = Array.from({ length: 256 }, (_, i) => {
  const [family, os, min, span, build] = templates[i % templates.length]
  const major = min + num(i, span, 7)
  return { input: build(major, i), expected: { browser: family, version: String(major), os } }
})
assert.equal(new Set(cases.map((c) => c.input)).size, cases.length, 'user-agent strings must be distinct')

// What each library calls a family or a system. The names are compared after
// lower-casing, dropping everything but letters, and taking out "mobile" and
// "microsoft", which only say that the browser is the phone edition.
const BROWSER_NAMES = { chrome: ['chrome'], firefox: ['firefox'], safari: ['safari'], edge: ['edge', 'edgechromium', 'edg'], opera: ['opera'] }
const OS_NAMES = {
  windows: ['windows'], macos: ['macos', 'macosx', 'osx', 'mac'], linux: ['linux', 'gnulinux'],
  android: ['android', 'androidos'], ios: ['ios'],
}
const letters = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '')
const canonBrowser = (name) => letters(name).replace(/mobile|microsoft/g, '')
const canonOs = (name) => { const s = letters(name); return s.startsWith('windows') ? 'windows' : s }
const familyOf = (table, name) => Object.keys(table).find((key) => table[key].includes(name)) ?? `unknown(${name})`
const majorOf = (version) => String(version).split('.')[0]

export const verifyOne = (i, output) => {
  const { input, expected } = cases[i]
  if (typeof output === 'string') output = JSON.parse(output)
  assert.ok(output && typeof output === 'object' && !Array.isArray(output), `fixture ${i}: a result object is required`)
  const got = {
    browser: familyOf(BROWSER_NAMES, canonBrowser(output.browser ?? '')),
    version: majorOf(output.version ?? ''),
    os: familyOf(OS_NAMES, canonOs(output.os ?? '')),
  }
  const want = expected
  assert.deepEqual(got, want, `fixture ${i} (${expected.browser} ${expected.version} on ${expected.os}): got ${JSON.stringify(output)} for ${input}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  const failures = []
  for (const i of cases.keys()) {
    try { verifyOne(i, outputs[i]) } catch (error) { failures.push(error.message.split('\n')[0]) }
  }
  assert.ok(failures.length === 0, `${failures.length} of ${cases.length} fixtures wrong. First ones:\n${failures.slice(0, 12).join('\n')}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
// Reads something cheap from each result, so the loop depends on it.
export const consume = (value) => (value.browser ? value.browser.length : 0) + (value.os ? value.os.length : 0)
