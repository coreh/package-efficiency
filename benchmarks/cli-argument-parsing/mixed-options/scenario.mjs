import { strict as assert } from 'node:assert'
// Declared interface (every adapter declares exactly this):
//   -v, --verbose      boolean
//   -d, --dry-run      boolean
//   -n, --name <text>  string
//   -c, --count <int>  integer
//   -t, --tag <text>   string, repeatable, in order
//   positionals        any number of file operands, options may be interleaved, "--" ends options
// Each input is { argv: string[] }. A correct result is
// { verbose, dry, name, count, tags, files } (name and count are null when absent).
const names = ['app', 'web server', 'my-service', 'données', 'release_2026', 'x']
const tagPool = ['alpha', 'beta', 'ci', 'needs review', 'v2', 'ops']
const filePool = ['src/main.rs', 'README.md', 'a b.txt', 'lib/index.js', 'data.csv', 'notes-final.txt', 'ünï.txt']
const pick = (pool, i, k) => pool[(i * 3 + k * 5) % pool.length]
const build = (i) => {
  const verbose = i % 3 === 0, dry = i % 5 === 1
  const name = i % 4 === 0 ? null : pick(names, i, 1)
  const count = i % 3 === 1 ? (i * 37) % 900 + 1 : null
  const tags = Array.from({ length: i % 4 === 3 ? 3 : i % 3 === 2 ? 1 : i % 6 === 5 ? 2 : 0 }, (_, k) => pick(tagPool, i, k))
  const nFiles = i % 6 === 4 ? 4 : i % 5
  const files = Array.from({ length: nFiles }, (_, k) => pick(filePool, i, k))
  const literal = i % 7 === 3 && files.length
  if (literal) files[files.length - 1] = ['--not-a-flag', '-x', '--verbose'][i % 3]
  const style = i % 3
  const groups = []
  if (verbose) groups.push(style === 1 ? ['--verbose'] : ['-v'])
  if (dry) groups.push(style === 2 ? ['-d'] : ['--dry-run'])
  if (name !== null) groups.push([['-n', name], [`--name=${name}`], ['--name', name]][style])
  if (count !== null) groups.push([[`--count=${count}`], ['-c', String(count)], ['--count', String(count)]][style])
  tags.forEach((t) => groups.push(Object.assign([['--tag', t], ['-t', t], [`--tag=${t}`]][(style + groups.length) % 3], { tag: t })))
  // deterministic rotation of option groups, then positionals interleaved between them
  const rot = groups.length ? i % groups.length : 0
  const ordered = [...groups.slice(rot), ...groups.slice(0, rot)]
  const orderedTags = ordered.filter((g) => g.tag !== undefined).map((g) => g.tag)
  const free = literal ? files.slice(0, -1) : files
  const argv = []
  let f = 0
  ordered.forEach((g, k) => { if (f < free.length && (i + k) % 2 === 0) argv.push(free[f++]); argv.push(...g) })
  while (f < free.length) argv.push(free[f++])
  if (literal) argv.push('--', files[files.length - 1])
  return { input: { argv }, expected: { verbose, dry, name, count, tags: orderedTags, files } }
}
export const cases = Array.from({ length: 46 }, (_, i) => build(i))
cases.push({ input: { argv: [] }, expected: { verbose: false, dry: false, name: null, count: null, tags: [], files: [] } })
cases.push({ input: { argv: ['-v', '--', '-v', 'z'] }, expected: { verbose: true, dry: false, name: null, count: null, tags: [], files: ['-v', 'z'] } })
const canonical = (r) => {
  if (typeof r === 'string') r = JSON.parse(r)
  assert.ok(r && typeof r === 'object', 'result object (or its JSON text) required')
  return { verbose: r.verbose, dry: r.dry, name: r.name, count: r.count, tags: [...r.tags], files: [...r.files] }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepEqual(canonical(outputs[i]), expected, `fixture ${i}: ${JSON.stringify(cases[i].input.argv)}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => typeof value === 'string' ? value.length : value.files.length + value.tags.length + 1
