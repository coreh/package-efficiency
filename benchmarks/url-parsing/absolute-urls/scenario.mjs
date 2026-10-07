import { strict as assert } from 'node:assert'
const hosts = ['example.com', 'www.example.org', 'api.v2.service.internal.example.net', 'localhost', '192.168.10.42', 'a.b.c.d.e.example.co.uk', 'xn--nxasmq6b.example', 'cdn-1.static_files.example.com']
const schemes = ['https', 'http', 'ftp', 'http', 'https', 'http']
const paths = ['/', '/index.html', '/a/b/c/d/e/f.txt', '/users/42/posts/1001/comments', '/caf%C3%A9/menu', '/files/report%202026.pdf', '/~user/docs/', '/a-b_c.d/e', '/v1/items;type=book/list', '/search/results/page/12/']
const queries = ['', '?q=url+parsing&lang=en', '?a=1&b=2&c=3&d=4', '?redirect=https%3A%2F%2Fexample.com%2Fx', '?empty=&flag', '?ids=1&ids=2']
const fragments = ['', '#top', '#section-3.2', '#!/route/a']
const auth = ['', '', '', 'user@', 'user:pass@', 'admin:s3cr3t%40x@']
const ports = ['', '', ':8080', ':3000', ':8443', ':65535']
const build = (scheme, userinfo, host, port, path, query, fragment) => ({
  input: `${scheme}://${userinfo}${host}${port}${path}${query}${fragment}`,
  expected: { scheme, userinfo: userinfo.slice(0, -1), host, port: port.slice(1), path, query: query.slice(1), fragment: fragment.slice(1) },
})
export const cases = Array.from({ length: 55 }, (_, i) => build(schemes[i % schemes.length], auth[(i * 7) % auth.length], hosts[(i * 3) % hosts.length], ports[(i * 5) % ports.length], paths[(i * 11) % paths.length], queries[(i * 13) % queries.length], fragments[(i * 17) % fragments.length]))
cases.push(build('https', '', 'example.com', '', '/' + 'segment/'.repeat(60), '?' + 'k=v&'.repeat(60) + 'end=1', '#frag'))
// Packages return their own shape: a WHATWG URL (protocol, username, password,
// hostname, ...) or RFC 3986 components (scheme, userinfo, host, ...). Both are
// read into one shape here, in the verifier, never in the timed call.
const text = (value) => (value === undefined || value === null ? '' : String(value))
const components = (out) => 'protocol' in out
  ? { scheme: out.protocol.replace(/:$/, ''), userinfo: out.username + (out.password ? `:${out.password}` : ''), host: out.hostname, port: text(out.port), path: out.pathname, query: out.search.replace(/^\?/, ''), fragment: out.hash.replace(/^#/, '') }
  : { scheme: text(out.scheme), userinfo: text(out.userinfo), host: text(out.host), port: text(out.port), path: text(out.path), query: text(out.query), fragment: text(out.fragment) }
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.ok(outputs[i] !== null && typeof outputs[i] === 'object', `fixture ${i}: parsed components required`)
    assert.deepStrictEqual(components(outputs[i]), expected, `fixture ${i}: ${cases[i].input}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (value.hostname ?? value.host).length
