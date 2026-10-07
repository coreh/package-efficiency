import { strict as assert } from 'node:assert'
// Each input is one raw HTTP/1.x request message as a string (CRLF line ends),
// possibly followed by a body. A correct result is
// { method, path, minor, headers }: the request target exactly as sent, the
// minor version (0 or 1), and the headers either as an ordered list of
// [name, value] pairs or as an object mapping a name to its list of values.
// Header names compare case-insensitively; values must match exactly.
const agents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'curl/8.7.1',
]
const hosts = ['example.com', 'www.example.org:8080', 'api.service.internal', 'localhost:3000', 'shop.example.co.uk']
const paths = ['/', '/index.html', '/search?q=http+parser&page=2', '/api/v1/users/42', '/static/js/app.3f9a1c.min.js', '/a%20b/%C3%A9t%C3%A9?x=1&y=%26', '/items?id=1&id=2&sort=-created', '/very/deep/path/with/many/segments/file.json']
const methods = ['GET', 'GET', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']
const build = (i) => {
  const method = methods[i % methods.length]
  const path = paths[(i * 3) % paths.length]
  const minor = i % 12 === 11 ? 0 : 1
  const headers = [['Host', hosts[i % hosts.length]], ['User-Agent', agents[i % agents.length]]]
  headers.push(['Accept', i % 2 ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'])
  headers.push(['Accept-Language', ['en-US,en;q=0.9', 'pt-BR,pt;q=0.9,en;q=0.8', 'de-DE,de;q=0.9'][i % 3]])
  headers.push(['Accept-Encoding', 'gzip, deflate, br'])
  if (i % 3 !== 0) headers.push(['Connection', i % 2 ? 'keep-alive' : 'close'])
  if (i % 4 === 0) headers.push(['Cookie', `session=${(i * 7919).toString(16).padStart(12, '0')}; theme=dark; _ga=GA1.2.${i}.${1700000000 + i}`])
  if (i % 5 === 0) headers.push(['Referer', `https://${hosts[(i + 1) % hosts.length]}/previous?from=${i}`])
  if (i % 6 === 0) headers.push(['Cache-Control', 'max-age=0'], ['Upgrade-Insecure-Requests', '1'])
  if (i % 7 === 0) headers.push(['Sec-Fetch-Dest', 'document'], ['Sec-Fetch-Mode', 'navigate'], ['Sec-Fetch-Site', 'none'], ['Sec-Fetch-User', '?1'])
  if (i % 9 === 0) headers.push(['X-Forwarded-For', `203.0.113.${i % 250}`], ['X-Forwarded-For', `198.51.100.${(i * 3) % 250}`])
  if (i % 10 === 5) headers.push(['If-None-Match', `"etag-${i}"`], ['If-Modified-Since', 'Wed, 21 Oct 2015 07:28:00 GMT'])
  if (i % 8 === 2) headers.push(['X-Request-Id', `req-${i}-${(i * 2654435761 % 4294967296).toString(36)}`], ['Authorization', `Bearer eyJhbGciOiJIUzI1NiJ9.${'x'.repeat(20 + i)}.sig`])
  let body = ''
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    body = JSON.stringify({ id: i, name: `item-${i}`, tags: ['a', 'b'] })
    headers.push(['Content-Type', 'application/json'], ['Content-Length', String(body.length)])
  }
  const input = `${method} ${path} HTTP/1.${minor}\r\n${headers.map(([n, v]) => `${n}: ${v}\r\n`).join('')}\r\n${body}`
  return { input, expected: { method, path, minor, headers } }
}
export const cases = Array.from({ length: 48 }, (_, i) => build(i))
const canonical = (headers) => {
  const out = {}
  const add = (n, v) => {
    assert.equal(typeof n, 'string'); assert.equal(typeof v, 'string')
    ;(out[n.toLowerCase()] ??= []).push(v)
  }
  if (Array.isArray(headers)) for (const [n, v] of headers) add(n, v)
  else {
    assert.ok(headers && typeof headers === 'object', 'headers must be a list or an object')
    for (const [n, vs] of Object.entries(headers)) for (const v of vs) add(n, v)
  }
  return out
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const r = outputs[i]
    assert.ok(r && typeof r === 'object', `fixture ${i}: result object required`)
    assert.equal(r.method, expected.method, `fixture ${i}: method`)
    assert.equal(r.path, expected.path, `fixture ${i}: path`)
    assert.equal(r.minor, expected.minor, `fixture ${i}: version`)
    assert.deepStrictEqual(canonical(r.headers), canonical(expected.headers), `fixture ${i}: headers`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
// Constant-time reads that allocate nothing (Object.keys on a headers object
// would build an array on every timed call).
export const consume = (value) => value.method.length + value.path.length + value.minor
