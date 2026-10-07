import { strict as assert } from 'node:assert'
// Declared interface (every adapter declares exactly this):
//   -v, --verbose      boolean
//   -d, --dry-run      boolean
//   -f, --force        boolean
//   -n, --name <text>  string
//   -c, --count <int>  integer
//   -t, --tag <text>   string, repeatable, in order
//   positionals        any number of file operands, "--" ends options
// The inputs use the compact spelling: grouped short flags (-vdf), a short option
// with its value attached (-nweb, -c42, -tops), and a group whose last letter takes
// a value (-vdn name, -vfc42, -dtops). Each input is { argv: string[] }. A correct
// result is { verbose, dry, force, name, count, tags, files }.
const names = ['app', 'web', 'my-service', 'données', 'release_2026', 'x', 'build.prod', 'Zed']
const tagPool = ['alpha', 'beta', 'ci', 'v2', 'ops', 'needs-review', 'tést']
const filePool = ['src/main.rs', 'README.md', 'a b.txt', 'lib/index.js', 'data.csv', 'notes-final.txt', 'ünï.txt']
const pick = (pool, i, k) => pool[(i * 3 + k * 5) % pool.length]
const build = (i) => {
  const bools = [['v', i % 3 !== 1], ['d', i % 2 === 0], ['f', i % 5 === 2 || i % 7 === 0]].filter(([, on]) => on).map(([l]) => l)
  const name = i % 4 === 0 ? null : pick(names, i, 1)
  const count = i % 3 === 1 ? (i * 37) % 900 + 1 : i % 11 === 5 ? 0 : null
  const tags = Array.from({ length: i % 4 === 3 ? 3 : i % 3 === 2 ? 1 : i % 6 === 5 ? 2 : 0 }, (_, k) => pick(tagPool, i, k))
  const nFiles = i % 6 === 4 ? 4 : i % 5
  const files = Array.from({ length: nFiles }, (_, k) => pick(filePool, i, k))
  const literal = i % 7 === 3 && files.length
  if (literal) files[files.length - 1] = ['--not-a-flag', '-vd', '-n'][i % 3]
  // valued options as [letter, value]
  const valued = []
  if (name !== null) valued.push(['n', name])
  if (count !== null) valued.push(['c', String(count)])
  tags.forEach((t) => valued.push(['t', t]))
  const attached = (i >> 1) % 2 === 0
  const argvOpts = []
  const rot = valued.length ? i % valued.length : 0
  const order = [...valued.slice(rot), ...valued.slice(0, rot)]
  const style = i % 4
  let rest = order
  if (bools.length && style !== 1) {
    // fold the booleans into one group; if it is the tail of the group a valued option may follow
    if (style === 3 && order.length) {
      const [l, v] = order[0]
      argvOpts.push(attached ? [`-${bools.join('')}${l}${v}`] : [`-${bools.join('')}${l}`, v])
      rest = order.slice(1)
    } else argvOpts.push([`-${bools.join('')}`])
  } else if (bools.length) bools.forEach((l) => argvOpts.push([`-${l}`]))
  rest.forEach(([l, v], k) => {
    const long = { n: 'name', c: 'count', t: 'tag' }[l]
    const form = (i + k) % 4
    argvOpts.push(form === 0 ? [`--${long}`, v] : form === 1 ? [`--${long}=${v}`] : (attached ? [`-${l}${v}`] : [`-${l}`, v]))
  })
  const free = literal ? files.slice(0, -1) : files
  const argv = []
  let f = 0
  argvOpts.forEach((g, k) => { if (f < free.length && (i + k) % 2 === 0) argv.push(free[f++]); argv.push(...g) })
  while (f < free.length) argv.push(free[f++])
  if (literal) argv.push('--', files[files.length - 1])
  return { input: { argv }, expected: { verbose: bools.includes('v'), dry: bools.includes('d'), force: bools.includes("f"), name, count, tags: order.filter(([l]) => l === "t").map(([, v]) => v), files } }
}
export const cases = Array.from({ length: 46 }, (_, i) => build(i))
cases.push({ input: { argv: [] }, expected: { verbose: false, dry: false, force: false, name: null, count: null, tags: [], files: [] } })
cases.push({ input: { argv: ['-vdf', '--', '-vdf', 'z'] }, expected: { verbose: true, dry: true, force: true, name: null, count: null, tags: [], files: ['-vdf', 'z'] } })
const canonical = (r) => {
  if (typeof r === 'string') r = JSON.parse(r)
  assert.ok(r && typeof r === 'object', 'result object (or its JSON text) required')
  return { verbose: r.verbose, dry: r.dry, force: r.force, name: r.name, count: r.count, tags: [...r.tags], files: [...r.files] }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepEqual(canonical(outputs[i]), expected, `fixture ${i}: ${JSON.stringify(cases[i].input.argv)}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => typeof value === 'string' ? value.length : value.files.length + value.tags.length + 1
