import { strict as assert } from 'node:assert'
// media type -> every extension a correct library may report as its default
const table = {
  'text/html': 'html htm shtml',
  'text/css': 'css',
  'text/javascript': 'js mjs ecma',
  'application/json': 'json',
  'application/xml': 'xml xsl xsd rng asa',
  'text/plain': 'txt text conf def list log in ini asm',
  'text/csv': 'csv',
  'text/calendar': 'ics ifb',
  'image/png': 'png',
  'image/jpeg': 'jpg jpeg jpe jfif',
  'image/gif': 'gif',
  'image/svg+xml': 'svg svgz',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/tiff': 'tif tiff',
  'image/x-icon': 'ico',
  'application/pdf': 'pdf',
  'application/wasm': 'wasm',
  'application/zip': 'zip',
  'application/x-tar': 'tar',
  'application/rtf': 'rtf',
  'application/msword': 'doc dot',
  'application/vnd.ms-excel': 'xls xlm xla xlc xlt xlw slk',
  'application/vnd.ms-powerpoint': 'ppt pps pot',
  'application/java-archive': 'jar war ear',
  'font/woff2': 'woff2',
  'font/ttf': 'ttf',
  'audio/mpeg': 'mp3 mpga mp2 mp2a m2a m3a',
  'audio/ogg': 'oga ogg spx opus',
  'audio/midi': 'mid midi kar rmi',
  'video/mp4': 'mp4 mp4v mpg4 m4v',
  'video/webm': 'webm',
  'video/quicktime': 'mov qt',
  'video/mpeg': 'mpeg mpg mpe m1v m2v',
  'application/x-sh': 'sh',
}
const types = Object.keys(table)
export const cases = []
for (let i = 0; i < 80; i++) {
  const input = types[(i * 7) % types.length]
  cases.push({ input, expected: table[input].split(' ') })
}
const clean = (s) => s.replace(/^\./, '').toLowerCase()
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i} (${input}): string output required`)
    assert.ok(expected.includes(clean(outputs[i])), `fixture ${i} (${input}): got ${outputs[i]}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
