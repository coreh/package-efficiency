import { strict as assert } from 'node:assert'
// An independent RFC 6570 expander (levels 1 to 4), used only to compute the
// expected strings. It is checked below against examples copied from the RFC.
const OPERATORS = {
  '': { first: '', sep: ',', named: false, ifEmpty: '', reserved: false },
  '+': { first: '', sep: ',', named: false, ifEmpty: '', reserved: true },
  '#': { first: '#', sep: ',', named: false, ifEmpty: '', reserved: true },
  '.': { first: '.', sep: '.', named: false, ifEmpty: '', reserved: false },
  '/': { first: '/', sep: '/', named: false, ifEmpty: '', reserved: false },
  ';': { first: ';', sep: ';', named: true, ifEmpty: '', reserved: false },
  '?': { first: '?', sep: '&', named: true, ifEmpty: '=', reserved: false },
  '&': { first: '&', sep: '&', named: true, ifEmpty: '=', reserved: false },
}
const utf8 = new TextEncoder()
const pct = (ch) => Array.from(utf8.encode(ch), (b) => '%' + b.toString(16).toUpperCase().padStart(2, '0')).join('')
const encodeUnreserved = (s) => Array.from(s, (ch) => /[A-Za-z0-9\-._~]/.test(ch) ? ch : pct(ch)).join('')
const encodeReserved = (s) => s.split(/(%[0-9A-Fa-f]{2})/).map((part, i) => i % 2 ? part : Array.from(part, (ch) => /[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]/.test(ch) ? ch : pct(ch)).join('')).join('')
const defined = (v) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0) && !(typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)
const expandReference = (template, vars, sortKeys) => template.replace(/\{([+#./;?&]?)([^}]+)\}/g, (_, op, list) => {
  const o = OPERATORS[op], enc = o.reserved ? encodeReserved : encodeUnreserved, out = []
  for (const spec of list.split(',')) {
    const [, name, explode, prefix] = /^([^:*]+)(\*)?(?::(\d+))?$/.exec(spec)
    const value = vars[name]
    if (!defined(value)) continue
    if (typeof value === 'string') {
      const text = enc(prefix ? Array.from(value).slice(0, Number(prefix)).join('') : value)
      out.push(o.named ? name + (text === '' ? o.ifEmpty : '=' + text) : text)
    } else if (Array.isArray(value)) {
      if (explode) for (const item of value) out.push(o.named ? name + (item === '' ? o.ifEmpty : '=' + enc(item)) : enc(item))
      else out.push((o.named ? name + '=' : '') + value.map(enc).join(','))
    } else {
      const pairs = Object.entries(value)
      if (sortKeys) pairs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      if (explode) for (const [k, item] of pairs) out.push(enc(k) + (item === '' && o.named ? o.ifEmpty : '=' + enc(item)))
      else out.push((o.named ? name + '=' : '') + pairs.map(([k, item]) => enc(k) + ',' + enc(item)).join(','))
    }
  }
  return out.length ? o.first + out.join(o.sep) : ''
})

// The variables of RFC 6570 section 3.2, and expansions copied from sections 1.2 and 3.2.2 to 3.2.9.
const rfcVars = {
  count: ['one', 'two', 'three'], dom: ['example', 'com'], dub: 'me/too', hello: 'Hello World!', half: '50%', var: 'value', who: 'fred',
  base: 'http://example.com/home/', path: '/foo/bar', list: ['red', 'green', 'blue'], keys: { semi: ';', dot: '.', comma: ',' },
  v: '6', x: '1024', y: '768', empty: '', empty_keys: {}, undef: null,
}
const rfcExamples = [
  ['{count}', 'one,two,three'], ['{count*}', 'one,two,three'], ['{/count}', '/one,two,three'], ['{/count*}', '/one/two/three'],
  ['{;count}', ';count=one,two,three'], ['{;count*}', ';count=one;count=two;count=three'], ['{?count}', '?count=one,two,three'],
  ['{?count*}', '?count=one&count=two&count=three'], ['{&count*}', '&count=one&count=two&count=three'],
  ['{var}', 'value'], ['{hello}', 'Hello%20World%21'], ['{half}', '50%25'], ['O{empty}X', 'OX'], ['O{undef}X', 'OX'], ['{x,y}', '1024,768'],
  ['{x,hello,y}', '1024,Hello%20World%21,768'], ['?{x,empty}', '?1024,'], ['?{x,undef}', '?1024'], ['?{undef,y}', '?768'], ['{var:3}', 'val'],
  ['{var:30}', 'value'], ['{list}', 'red,green,blue'], ['{list*}', 'red,green,blue'], ['{keys}', 'semi,%3B,dot,.,comma,%2C'], ['{keys*}', 'semi=%3B,dot=.,comma=%2C'],
  ['{+var}', 'value'], ['{+hello}', 'Hello%20World!'], ['{+half}', '50%25'], ['{base}index', 'http%3A%2F%2Fexample.com%2Fhome%2Findex'],
  ['{+base}index', 'http://example.com/home/index'], ['O{+empty}X', 'OX'], ['O{+undef}X', 'OX'], ['{+path}/here', '/foo/bar/here'],
  ['here?ref={+path}', 'here?ref=/foo/bar'], ['up{+path}{var}/here', 'up/foo/barvalue/here'], ['{+x,hello,y}', '1024,Hello%20World!,768'],
  ['{+path,x}/here', '/foo/bar,1024/here'], ['{+path:6}/here', '/foo/b/here'], ['{+list}', 'red,green,blue'], ['{+list*}', 'red,green,blue'],
  ['{+keys}', 'semi,;,dot,.,comma,,'], ['{+keys*}', 'semi=;,dot=.,comma=,'],
  ['{#var}', '#value'], ['{#hello}', '#Hello%20World!'], ['{#half}', '#50%25'], ['foo{#empty}', 'foo#'], ['foo{#undef}', 'foo'], ['{#x,hello,y}', '#1024,Hello%20World!,768'],
  ['{#path,x}/here', '#/foo/bar,1024/here'], ['{#path:6}/here', '#/foo/b/here'], ['{#list}', '#red,green,blue'], ['{#list*}', '#red,green,blue'],
  ['{#keys}', '#semi,;,dot,.,comma,,'], ['{#keys*}', '#semi=;,dot=.,comma=,'],
  ['{.who}', '.fred'], ['{.who,who}', '.fred.fred'], ['{.half,who}', '.50%25.fred'], ['www{.dom*}', 'www.example.com'], ['X{.var}', 'X.value'], ['X{.empty}', 'X.'],
  ['X{.undef}', 'X'], ['X{.var:3}', 'X.val'], ['X{.list}', 'X.red,green,blue'], ['X{.list*}', 'X.red.green.blue'], ['X{.keys}', 'X.semi,%3B,dot,.,comma,%2C'],
  ['X{.keys*}', 'X.semi=%3B.dot=..comma=%2C'], ['X{.empty_keys}', 'X'], ['X{.empty_keys*}', 'X'],
  ['{/who}', '/fred'], ['{/who,who}', '/fred/fred'], ['{/half,who}', '/50%25/fred'], ['{/who,dub}', '/fred/me%2Ftoo'], ['{/var}', '/value'], ['{/var,empty}', '/value/'],
  ['{/var,undef}', '/value'], ['{/var,x}/here', '/value/1024/here'], ['{/var:1,var}', '/v/value'], ['{/list}', '/red,green,blue'], ['{/list*}', '/red/green/blue'],
  ['{/list*,path:4}', '/red/green/blue/%2Ffoo'], ['{/keys}', '/semi,%3B,dot,.,comma,%2C'], ['{/keys*}', '/semi=%3B/dot=./comma=%2C'],
  ['{;who}', ';who=fred'], ['{;half}', ';half=50%25'], ['{;empty}', ';empty'], ['{;v,empty,who}', ';v=6;empty;who=fred'], ['{;v,bar,who}', ';v=6;who=fred'],
  ['{;x,y}', ';x=1024;y=768'], ['{;x,y,empty}', ';x=1024;y=768;empty'], ['{;x,y,undef}', ';x=1024;y=768'], ['{;hello:5}', ';hello=Hello'], ['{;list}', ';list=red,green,blue'],
  ['{;list*}', ';list=red;list=green;list=blue'], ['{;keys}', ';keys=semi,%3B,dot,.,comma,%2C'], ['{;keys*}', ';semi=%3B;dot=.;comma=%2C'],
  ['{?who}', '?who=fred'], ['{?half}', '?half=50%25'], ['{?x,y}', '?x=1024&y=768'], ['{?x,y,empty}', '?x=1024&y=768&empty='], ['{?x,y,undef}', '?x=1024&y=768'],
  ['{?var:3}', '?var=val'], ['{?list}', '?list=red,green,blue'], ['{?list*}', '?list=red&list=green&list=blue'], ['{?keys}', '?keys=semi,%3B,dot,.,comma,%2C'],
  ['{?keys*}', '?semi=%3B&dot=.&comma=%2C'],
  ['{&who}', '&who=fred'], ['{&half}', '&half=50%25'], ['?fixed=yes{&x}', '?fixed=yes&x=1024'], ['{&x,y,empty}', '&x=1024&y=768&empty='], ['{&x,y,undef}', '&x=1024&y=768'],
  ['{&var:3}', '&var=val'], ['{&list}', '&list=red,green,blue'], ['{&list*}', '&list=red&list=green&list=blue'], ['{&keys}', '&keys=semi,%3B,dot,.,comma,%2C'],
  ['{&keys*}', '&semi=%3B&dot=.&comma=%2C'],
]
for (const [template, expected] of rfcExamples) assert.equal(expandReference(template, rfcVars, false), expected, `reference expander: ${template}`)

// Templates of the kind found in API descriptions, with several variable sets each.
const apiTemplates = [
  'https://api.example.com/repos/{owner}/{repo}/issues{/number}{?state,labels,page,per_page}',
  'https://api.example.com/search{?q,sort,order}{&page,per_page}{#section}',
  '/users/{user}/files{/segments*}{.format}{?version}',
  '{+base}v2/items{;filter*}{?fields,expand*}',
  '/maps/{z}/{x}/{y}{.format}{?token}',
  '{scheme}://{host}{.tld*}{/path*}{?query*}{#frag}',
  '/archive/{year:4}/{title:12}{?tags*,limit}',
  '/static{+path}/{name}{.ext}',
]
const apiVars = Array.from({ length: 6 }, (_, i) => ({
  owner: ['octo cat', 'rust-lang', 'José', '日本語', 'a.b_c~d', 'x/y'][i], repo: ['hello-world', 'cargo', 'café&bar', 'リポジトリ', 'r', 'r?s'][i],
  number: i % 2 ? String(100 + i * 37) : null, state: ['open', 'closed', null][i % 3], labels: i % 3 === 0 ? ['bug', 'help wanted', 'P1'] : i % 3 === 1 ? null : ['a,b'],
  page: String(i + 1), per_page: i % 2 ? '50' : null, q: ['is:open label:"good first issue"', 'a+b=c', '100%', 'ünï côdé', '', 'x y z'][i], sort: i % 2 ? 'updated' : null,
  order: ['asc', 'desc'][i % 2], section: i % 3 === 0 ? 'results/top' : null, user: ['alice', 'bob smith', 'Ωmega'][i % 3],
  segments: [['docs', 'api v2', 'index'], ['a/b', 'c'], null][i % 3], format: ['json', 'tar.gz', null][i % 3], version: i % 2 ? '1.2.3' : '',
  base: 'https://example.org/api/', filter: i % 2 ? { color: 'red', size: 'x l' } : { 'a b': '1', c: '2' }, fields: ['id', 'name', 'created at'], expand: i % 2 ? { author: 'full' } : null,
  z: String(i + 3), x: String(1024 >> i), y: String(768 + i), token: i % 2 ? 'abc/def+ghi==' : null, scheme: 'https', host: 'www', tld: ['example', ['co', 'uk'][i % 2]],
  path: i % 2 ? '/assets/img' : ['a', 'b c'], query: { lang: ['en', 'pt-BR', 'zh'][i % 3], q: 'tea & biscuits' }, frag: i % 2 ? 'top' : null,
  year: String(2020 + i) + '-extra', title: ['Hello, World and more', 'Ünïcödé títle here', '短いタイトルと長い続き'][i % 3], tags: i % 2 ? ['x', 'y z'] : null, limit: '10',
  name: ['main', 'app.min', 'ünï'][i % 3], ext: ['js', 'css', null][i % 3],
}))
const drop = (vars) => Object.fromEntries(Object.entries(vars).filter(([, v]) => v !== null))
export const cases = [
  ...rfcExamples.map(([template]) => ({ input: { template, vars: drop(rfcVars) } })),
  ...apiTemplates.flatMap((template, t) => apiVars.filter((_, i) => !(template.includes('{/path*}') && i % 2)).map((vars) => ({ input: { template, vars: drop(vars) } }))),
]
// Undefined variables are left out of the input, the way every package expects them.
// The order of the pairs of an associative array is not fixed by the RFC: the
// order written in the fixture and alphabetical order (what a sorted map gives) are both accepted.
const accepted = cases.map(({ input }) => [expandReference(input.template, input.vars, false), expandReference(input.template, input.vars, true)])
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verifyOne = (i, output) => {
  assert.equal(typeof output, 'string', `fixture ${i}: string output required`)
  assert.ok(accepted[i].includes(output), `fixture ${i}: ${cases[i].input.template} gave ${output}, expected ${accepted[i][0]}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
