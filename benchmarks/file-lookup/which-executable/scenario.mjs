import { strict as assert } from 'node:assert'
import { posix } from 'node:path'
// The harness creates `files.tree` in the task's scratch directory before
// each adapter process starts, and names that directory in BENCH_FILES.
const scratch = process.env.BENCH_FILES ?? '/BENCH_FILES-is-not-set'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const r = rng(4049)
const pick = (list) => list[Math.floor(r() * list.length)]

const tree = []
const exe = (path, mode = 0o755) => tree.push({ path, content: `#!/bin/sh\n# ${posix.basename(path)}\nexit 0\n`, mode })
const plain = (path, mode = 0o644) => tree.push({ path, content: `# ${posix.basename(path)}: not a program\n`, mode })
const dir = (path) => tree.push({ path: `${path}/` })
const link = (path, target) => tree.push({ path, link: target })

// Program names: unique, made from parts, the same on every run.
const heads = ['git', 'py', 'node', 'cc', 'ld', 'ar', 'gz', 'tar', 'ssh', 'perl', 'awk', 'sed', 'make', 'clang', 'lua', 'xz', 'zip', 'curl', 'open', 'diff', 'grep', 'find', 'sort', 'stat', 'kill', 'man', 'nc', 'od', 'tr', 'wc']
const tails = ['', '-config', '-dump', 'info', 'ctl', '-tool', 'd', '2', '3', '-gen', 'stat', '-cli', 'x', '-wrapper', 'test']
// Names placed by hand below are kept out of the generated ones.
const shared = ['python3', 'git', 'node', 'make', 'clang', 'perl5.36']
const odd = ['g++', 'python3.12', 'x86_64-linux-gnu-gcc', '.hidden-tool', 'my tool', 'café', '[', 'a', 'node_modules']
const trapNames = ['fmt-tool', 'lint-tool', 'run-tool', 'gone-tool', 'text-tool', 'dir-tool', 'loop-tool', 'loop-tool-2', 'chain-tool', 'chain-mid', 'only-dir', 'only-text', 'private-tool']
const used = new Set([...shared, ...odd, ...trapNames])
const fresh = () => {
  for (;;) {
    const name = pick(heads) + pick(tails) + (r() < 0.25 ? String(Math.floor(r() * 90) + 10) : '')
    if (!used.has(name)) { used.add(name); return name }
  }
}
const names = (count) => Array.from({ length: count }, fresh)

// System directories: many programs, all executable.
const usrBin = names(300); for (const n of usrBin) exe(`usr/bin/${n}`)
const bin = names(36); for (const n of bin) exe(`bin/${n}`)
const usrSbin = names(80); for (const n of usrSbin) exe(`usr/sbin/${n}`)
const sbin = names(20); for (const n of sbin) exe(`sbin/${n}`)
const usrLocal = names(60); for (const n of usrLocal) exe(`usr/local/bin/${n}`)
plain('usr/local/bin/README'); plain('usr/share/man/man1/ls.1')
// Homebrew style: links into versioned package directories.
const brew = names(50)
brew.forEach((n, i) => { exe(`opt/homebrew/Cellar/pkg-${i % 17}/1.${i % 5}.0/bin/${n}`); link(`opt/homebrew/bin/${n}`, `../Cellar/pkg-${i % 17}/1.${i % 5}.0/bin/${n}`) })
// User directories: a dot directory with scripts, some never made executable.
const local = names(24)
local.forEach((n, i) => (i % 3 === 0 ? plain(`home/dev/.local/bin/${n}`) : i % 3 === 1 ? exe(`home/dev/.local/bin/${n}`, 0o700) : exe(`home/dev/.local/bin/${n}`)))
const cargo = names(15); for (const n of cargo) exe(`home/dev/.cargo/bin/${n}`)
const gobin = names(10); for (const n of gobin) exe(`home/dev/go/bin/${n}`)
const spaced = names(8); for (const n of spaced) exe(`home/dev/my tools/bin/${n}`)
const accented = names(6); for (const n of accented) exe(`home/dev/wërkzeug/bin/${n}`)
// A tool directory reached through a link to its current version.
const tools = names(12); for (const n of tools) exe(`opt/tools/2.4.1/bin/${n}`)
link('opt/tools/current', '2.4.1')
// node_modules/.bin: links to package scripts, one of them not executable.
const npmBins = names(10)
npmBins.forEach((n, i) => (i === 3 ? plain(`home/dev/app/node_modules/${n}/cli.js`) : exe(`home/dev/app/node_modules/${n}/cli.js`)))
npmBins.forEach((n) => link(`home/dev/app/node_modules/.bin/${n}`, `../${n}/cli.js`))
// A regular file that a PATH names as if it were a directory.
plain('etc/paths')

// Programs found in several directories (the first executable one wins).
for (const n of shared) exe(`usr/bin/${n}`)
for (const n of ['python3', 'git', 'node', 'clang']) { exe(`opt/homebrew/Cellar/${n}/9.9/bin/${n}`); link(`opt/homebrew/bin/${n}`, `../Cellar/${n}/9.9/bin/${n}`) }
plain('home/dev/.local/bin/python3'); exe('home/dev/.local/bin/make'); exe('usr/local/bin/perl5.36'); exe('bin/make')

// Traps: in `home/dev/shadow` each name is something that is not an
// executable file; a later directory holds the real program.
const traps = {
  'fmt-tool': (p) => plain(p),
  'lint-tool': (p) => plain(p, 0o600),
  'run-tool': (p) => exe(`${p}/run-tool`),
  'gone-tool': (p) => link(p, '../nowhere/gone-tool'),
  'text-tool': (p) => { plain('home/dev/notes/text-tool.txt'); link(p, '../notes/text-tool.txt') },
  'dir-tool': (p) => { dir('home/dev/notes/dir-tool'); link(p, '../notes/dir-tool') },
  'loop-tool': (p) => { link(p, 'loop-tool-2'); link('home/dev/shadow/loop-tool-2', 'loop-tool') },
}
for (const [n, make] of Object.entries(traps)) { make(`home/dev/shadow/${n}`); exe(`usr/local/bin/${n}`) }
// The real one is in the trap directory itself, by link chain or mode 700.
exe('home/dev/notes/chain-real', 0o700); link('home/dev/shadow/chain-tool', 'chain-mid'); link('home/dev/shadow/chain-mid', '../notes/chain-real')
dir('home/dev/shadow/only-dir')
plain('home/dev/shadow/only-text')
exe('home/dev/shadow/private-tool', 0o700)
// Names careless code gets wrong.
exe('usr/bin/g++'); exe('usr/bin/python3.12'); exe('home/dev/.cargo/bin/x86_64-linux-gnu-gcc'); exe('home/dev/.local/bin/.hidden-tool')
exe('home/dev/my tools/bin/my tool'); exe('home/dev/wërkzeug/bin/café'); exe('bin/['); exe('home/dev/go/bin/a'); dir('usr/local/bin/node_modules')

export const files = { tree }

// The reference: resolve a path through the declared tree, following links.
const entries = new Map(tree.map((entry) => [entry.path.replace(/\/$/, ''), entry]))
const directories = new Set()
for (const entry of tree) {
  const parts = entry.path.replace(/\/$/, '').split('/')
  for (let i = 1; i < parts.length; i++) directories.add(parts.slice(0, i).join('/'))
  if (entry.path.endsWith('/')) directories.add(parts.join('/'))
}
// { kind: 'file', mode, real } | { kind: 'dir', real } | null (missing, a loop, or a file used as a directory)
function resolve(path) {
  let pending = path.split('/'), done = [], hops = 0
  while (pending.length) {
    const here = [...done, pending[0]].join('/')
    const entry = entries.get(here)
    if (entry?.link !== undefined) {
      if (++hops > 40) return null
      pending = [...posix.normalize(posix.join(posix.dirname(here), entry.link)).split('/'), ...pending.slice(1)]
      done = []
      continue
    }
    if (entry && !entry.path.endsWith('/')) return pending.length === 1 ? { kind: 'file', mode: entry.mode ?? 0o644, real: here } : null
    if (!directories.has(here)) return null
    done.push(pending.shift())
  }
  return { kind: 'dir', real: done.join('/') }
}
// The first PATH directory whose `<dir>/<name>` is an executable regular file
// (after links); the path is the PATH entry joined to the name, not resolved.
// The flags describe wrong answers that the check must refuse.
function lookup(pathDirs, name, { anyFile = false, noDirCheck = false, realPath = false, last = false } = {}) {
  let found = null
  for (const d of pathDirs) {
    const target = resolve(`${d}/${name}`)
    const ok = target && (target.kind === 'file' ? anyFile || (target.mode & 0o100) !== 0 : noDirCheck)
    if (!ok) continue
    found = realPath ? target.real : `${d}/${name}`
    if (!last) break
  }
  return found
}

const misses = (count, stem) => Array.from({ length: count }, (_, i) => `${stem}-${i}`)
const take = (list, count) => Array.from({ length: count }, () => pick(list))
const fixtures = [
  {
    // A developer's PATH: user directories first, then Homebrew, then the system.
    path: ['home/dev/.local/bin', 'home/dev/.cargo/bin', 'opt/homebrew/bin', 'usr/local/bin', 'usr/bin', 'bin', 'usr/sbin', 'sbin'],
    commands: [...shared, ...take(local, 4), ...take(cargo, 3), ...take(brew, 5), ...take(usrLocal, 4), ...take(usrBin, 8), ...take(bin, 3), ...take(usrSbin, 2), ...take(sbin, 2), ...misses(3, 'not-installed')],
  },
  {
    // A long PATH with a missing directory, a file, a linked directory, a
    // repeated directory, a space and a non-ASCII name; many names are missing.
    path: ['home/dev/app/node_modules/.bin', 'missing/bin', 'home/dev/go/bin', 'etc/paths', 'home/dev/my tools/bin', 'home/dev/wërkzeug/bin', 'opt/tools/current/bin', 'usr/local/bin', 'usr/local/bin', 'opt/homebrew/bin', 'usr/bin', 'bin', 'usr/sbin', 'sbin', 'home/dev/.cargo/bin', 'home/dev/.local/bin'],
    commands: [...npmBins, ...take(gobin, 3), ...take(spaced, 3), ...take(accented, 2), ...take(tools, 4), ...take(sbin, 2), ...take(cargo, 2), ...take(local, 4), ...misses(10, 'probe')],
  },
  {
    // Every trap directory first.
    path: ['home/dev/shadow', 'home/dev/.local/bin', 'usr/local/bin', 'usr/bin', 'bin'],
    commands: [...Object.keys(traps), 'chain-tool', 'only-dir', 'only-text', 'private-tool', 'node_modules', ...shared, ...take(local, 6), ...take(usrLocal, 6), ...take(usrBin, 4), ...take(bin, 4), ...misses(2, 'trap-miss')],
  },
  {
    // Unusual names, and names not found anywhere on a PATH of every directory.
    path: ['opt/homebrew/bin', 'usr/local/bin', 'usr/bin', 'bin', 'usr/sbin', 'sbin', 'home/dev/.cargo/bin', 'home/dev/.local/bin', 'home/dev/go/bin', 'home/dev/my tools/bin', 'home/dev/wërkzeug/bin', 'opt/tools/current/bin'],
    commands: [...odd, ...take(tools, 3), ...take(brew, 4), ...take(usrSbin, 4), ...misses(20, 'absent')],
  },
]
for (const { commands } of fixtures) assert.equal(commands.length, 40, 'every fixture looks up 40 names')

export const cases = fixtures.map(({ path, commands }) => ({
  input: { path: path.map((d) => `${scratch}/${d}`).join(':'), commands },
  expected: commands.map((name) => lookup(path, name)),
}))

// A result is a list with one entry per name, in order: the absolute path of
// the first executable found (the PATH entry joined to the name), or null.
// Nothing else is forgiven.
export function verifyOne(i, result) {
  const { input, expected } = cases[i]
  assert.ok(Array.isArray(result), `fixture ${i}: a list is required`)
  assert.equal(result.length, expected.length, `fixture ${i}: ${result.length} results, expected ${expected.length}`)
  for (let j = 0; j < expected.length; j++) {
    const want = expected[j] === null ? null : `${scratch}/${expected[j]}`
    assert.equal(result[j], want, `fixture ${i}: "${input.commands[j]}"`)
  }
}
export const verifyResults = (outputs) => {
  assert.equal(outputs?.length, cases.length, 'one output per fixture is required')
  outputs.forEach((output, i) => verifyOne(i, output))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length

// The check refuses answers that did not do the job: any file taken as a
// program (no execute bit, no type check), a directory taken as a program,
// the link target instead of the PATH entry, the last match instead of the
// first, and nothing found.
const answer = (options) => fixtures.map(({ path, commands }) => commands.map((name) => {
  const found = lookup(path, name, options)
  return found === null ? null : `${scratch}/${found}`
}))
for (const options of [{ anyFile: true }, { noDirCheck: true }, { realPath: true }, { last: true }])
  assert.throws(() => verifyResults(answer(options)), undefined, `the check must refuse ${JSON.stringify(options)}`)
assert.throws(() => verifyResults(fixtures.map(({ commands }) => commands.map(() => null))))
assert.doesNotThrow(() => verifyResults(answer({})))
