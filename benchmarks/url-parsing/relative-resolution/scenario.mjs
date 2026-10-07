import { strict as assert } from 'node:assert'
// "#" in a base and "@" in a reference stand for the fixture's index, so every
// base and all but the six dot-only references are distinct strings.
const bases = [
  'http://a#/b/c/d;p?q',
  'https://docs#.example.com/docs/guide/intro.html',
  'https://user:pw@api#.example.org:8443/v2/items/42?expand=1',
  'http://dev#.localhost:3000/app/index.html?tab=2',
  'https://cdn#.example.net/assets/js/vendor/lib.min.js',
  'http://files#.example.com/pub/releases/2026/notes.txt',
  'https://www#.example.co.uk/a/b/c/d/e/f/page',
  'https://s#.example.com/',
  'http://192.168.10.#:8080/admin/users/list?page=3',
]
const refs = [
  'g@', './g@', 'g@/', '/g@', '?y@', 'g@?y', 'g@#s', '#s@', ';x@', 'g@;x=1/y', 'g@?y#s',
  '.', './', '..', '../', '../g@', '../..', '../../', '../../g@', '../../../g@', '../../../../g@',
  '/./g@', '/../g@', 'g@.', '.g@', 'g@..', '..g@', './../g@', './g@/.', 'g@/./h', 'g@/../h',
  'sub/dir/file@.png?v=3', '../img/logo%20mark@.svg', '//other.example.org/x/y?z=@', 'https://elsewhere.example.com/p/q/r?m=@',
  'http://abs.example.com:81/a/c?k=v#frag@', '../../../../../../deep/target@.html',
]
// Reference resolver written from RFC 3986 section 5.2, used only to produce
// the expected strings. Every input avoids what WHATWG and RFC 3986 normalize
// differently (case, default ports, empty paths, spaces).
const split = (u) => {
  const m = /^(?:([a-z][a-z0-9+.-]*):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/.exec(u)
  return { scheme: m[1], authority: m[2], path: m[3], query: m[4], fragment: m[5] }
}
const removeDots = (path) => {
  const out = []
  const segs = path.split('/')
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]
    const last = i === segs.length - 1
    if (s === '.') { if (last) out.push('') } else if (s === '..') { if (out.length > 1) out.pop(); if (last) out.push('') } else out.push(s)
  }
  return out.join('/')
}
const resolveReference = (base, ref) => {
  const b = split(base)
  const r = split(ref)
  const t = {}
  if (r.scheme !== undefined) Object.assign(t, r, { path: removeDots(r.path) })
  else if (r.authority !== undefined) Object.assign(t, { scheme: b.scheme, authority: r.authority, path: removeDots(r.path), query: r.query })
  else {
    t.scheme = b.scheme
    t.authority = b.authority
    if (r.path === '') { t.path = b.path; t.query = r.query !== undefined ? r.query : b.query }
    else {
      const merged = r.path[0] === '/' ? r.path : b.path.slice(0, b.path.lastIndexOf('/') + 1) + r.path
      t.path = removeDots(merged)
      t.query = r.query
    }
  }
  t.fragment = r.fragment
  return `${t.scheme}:${t.authority !== undefined ? `//${t.authority}` : ''}${t.path}${t.query !== undefined ? `?${t.query}` : ''}${t.fragment !== undefined ? `#${t.fragment}` : ''}`
}
// An input is [base, reference]; 108 pairs chosen by fixed strides.
export const cases = Array.from({ length: 108 }, (_, i) => {
  const base = bases[(i * 5 + Math.floor(i / 9)) % bases.length].replace('#', i)
  const ref = refs[(i * 7 + Math.floor(i / 5)) % refs.length].replace('@', i)
  return { input: [base, ref], expected: resolveReference(base, ref) }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(outputs[i], expected, `fixture ${i}: ${input[1]} against ${input[0]}`)
  }
  // Something only real resolution produces: dot segments are gone and no
  // output is just its reference or its base.
  assert.ok(cases.some(({ input }, i) => outputs[i] !== input[0] && outputs[i] !== input[1]), 'resolution required')
  for (const [i, out] of outputs.entries()) assert.ok(!/\/\.\.?(\/|$)/.test(out.replace(/^[a-z]+:\/\/[^/]*/, '')), `fixture ${i}: dot segments left`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
