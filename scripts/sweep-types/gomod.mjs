// Type-check cost of Go modules, the counterpart of scripts/measure-types.mjs
// and of the crates.io sweep. Writes data/gomod/types.json.
//
// Usage: node scripts/sweep-types/gomod.mjs <module>... | --top=N
//        [--force] [--retry-failed] [--runs=11] [--cold-runs=3] [--build-runs=1]
//        [--graded=check|build] [--std=exclude|include] [--keep] [--out=file]
// --top=N takes the N most used of data/gomod/packages.json and everything in
// data/gomod/picked.json. A run can be stopped and started again: the results
// file is written after every module, modules already in it are skipped
// (--retry-failed tries the ones that are not `ok` again, --force everything),
// and Ctrl-C finishes the module in hand.
//
// Generated program: a package that blank-imports the module's importable
// packages and nothing else:
//   go.mod:   module probe / require <module> <version>
//   probe.go: package probe; import ( _ "<package>" ... )
// The packages are the module root when it is a package (with more than a
// doc.go); otherwise the
// module's packages that are not `main`, not under internal/, testdata/,
// vendor/ or example(s)/ and have non-test files, the 20 shallowest (then
// alphabetical). `packages` records them, `packagesInModule` how many there
// were. A module with none is `no-entry`.
//
// Go has no check-only command, so there are two figures, both cold, both for
// the whole tree (the module, every dependency and the parts of the standard
// library they import), both with cgo off and nothing reused from an earlier
// run:
//   check  THE GRADED FIGURE (`added`). The tree type-checked from source by
//          go/types, the Go distribution's own type checker, with nothing
//          compiled: scripts/sweep-types/gomod-typecheck.go over the output
//          of `go list -deps -json`, one fresh process, one thread. This is
//          what `cargo check` is to `cargo build`. It keeps no cache, so every
//          `checkSplit` says how much of one run's time went to the standard
//          library's packages and how much to the modules'. Every
//          run is a first check: --runs runs, or --cold-runs when one takes
//          more than three CPU-seconds; medians.
//   build  `go build -mod=readonly .` of the probe package with an empty
//          GOCACHE: type check plus code generation of the whole tree, no
//          link (the probe is not a main package). --build-runs runs (0 to
//          skip). Recorded as `build`, graded only with --graded=build.
//          Typically several times the check figure, mostly code generation.
// `go vet` is not used: it needs the compiled export data of every dependency,
// so it is the build plus the analyzers.
// What is subtracted: by default a second probe that imports only the
// standard-library packages the tree's modules import, measured the same way
// for each module. So `added` is the module and its dependency modules, not
// the standard library they use (Rust's standard library comes checked; Go's
// is source, and for a small module it is nearly the whole cost: uuid's tree
// is 107 standard packages and one of its own). `wholeTree` in each figure is
// the cost over an empty probe, `standardLibrary` the reference's; with
// --std=include `added` is the whole tree. Process CPU (user + system of the whole process tree) and
// the peak RSS of the largest process. No network is in either figure:
// sources are fetched first, the check reads files only, and the build runs
// with GOPROXY=off.
//
// Classification:
//   ok             the tree type-checks
//   no-entry       the module has no importable package
//   install-failed no release at least 7 days old that this Go can use, or a
//                  module of the build list is too new, or the proxy has not
//                  got it
//   check-failed   the tree cannot be loaded or has type errors; `needsCgo`
//                  marks a module whose packages need cgo (C is never compiled)
//
// Safety, as scripts/lib/native-packages.mjs does it for the adapters: the go
// command is only ever given this project's own proxy (goProxy there), which
// passes metadata on and refuses the source zip of any module version less
// than seven days old. The version measured is the listed one if old enough,
// else the newest that is. The whole build list is checked against
// proxy.golang.org from go.mod files alone before any source is asked for,
// and again once the imports are resolved. Checksums are verified against
// sum.golang.org. GOTOOLCHAIN=local (no toolchain is ever downloaded),
// CGO_ENABLED=0, no `go generate`, no test or tool of a module is run; the
// timed build is -mod=readonly.
//
// Disk: the sweep has its own GOMODCACHE and GOCACHE under
// .cache/sweep-types/gomod/, emptied after every module and removed at the
// end (unless --keep). Every 25 modules the free space is checked; under 6 GB
// the sweep stops and can be resumed.
import { existsSync } from 'node:fs'
import { mkdir, statfs, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { goProxy } from '../lib/native-packages.mjs'
import { MIN_RELEASE_AGE_DAYS, args, discard, exec, fromRoot, loadTargets, median, oldEnough, removeDir, round, spread, sweep, timed } from './lib.mjs'

const { names, value, has } = args('Usage: node scripts/sweep-types/gomod.mjs <module>... | --top=N [--force] [--retry-failed] [--runs=11] [--cold-runs=3] [--build-runs=1] [--graded=check|build] [--keep] [--out=file]')
const RUNS = Number(value('runs', 11))
const COLD_RUNS = Number(value('cold-runs', 3))
const BUILD_RUNS = Number(value('build-runs', 1))
// Whether the standard library the tree imports is counted against the module.
const STD = value('std', 'exclude')
if (!['exclude', 'include'].includes(STD)) throw new Error('--std must be exclude or include')
const GRADED = value('graded', 'check')
if (!['check', 'build'].includes(GRADED)) throw new Error('--graded must be check or build')
if (GRADED === 'build' && BUILD_RUNS < 1) throw new Error('--graded=build needs --build-runs of at least 1')
const SLOW_MS = 3000
const PACKAGE_LIMIT = 20
const MIN_FREE_GB = 6
const TIMEOUT_MS = 15 * 60_000
const WORK = fromRoot('.cache/sweep-types/gomod')
const OUT = value('out') ? path.resolve(value('out')) : fromRoot('data/gomod/types.json')
const GO = '/opt/homebrew/bin/go'
const MODCACHE = path.join(WORK, 'mod')
const BUILDCACHE = path.join(WORK, 'build')
const CHECKER = path.join(WORK, 'bin', 'gomod-typecheck')
const { targets, listedVersion } = await loadTargets('gomod', names, Number(value('top', 0)))

const goVersion = /go(\d+\.\d+(\.\d+)?)/.exec((await exec(GO, ['version'], { env: { ...process.env, GOTOOLCHAIN: 'local' } })).stdout)[1]
const BASE_ENV = { ...process.env, GOPATH: path.join(WORK, 'gopath'), GOMODCACHE: MODCACHE, GOCACHE: BUILDCACHE, GOTOOLCHAIN: 'local', CGO_ENABLED: '0', GONOSUMDB: '', GONOSUMCHECK: '', GONOPROXY: '', GOPRIVATE: '', GOINSECURE: '', GOSUMDB: 'sum.golang.org', GOWORK: 'off' }
const ONLINE = { ...BASE_ENV, GOPROXY: await goProxy(), GOFLAGS: '-mod=mod' }
const OFFLINE = { ...BASE_ENV, GOPROXY: 'off', GOFLAGS: '-mod=readonly' }
const firstError = (error) => String(error.stderr || error.message).trim().split('\n').filter((l) => l && !/^go: (downloading|finding|found|added|upgraded) /.test(l) && !/^(package probe|\s+imports )/.test(l) && !l.startsWith('#'))[0]?.slice(0, 300) ?? 'failed'
const go = (argv, cwd, env = ONLINE) => exec(GO, argv, { cwd, env, maxBuffer: 1 << 30, timeout: TIMEOUT_MS }).then((r) => r.stdout)
// `go list -json` prints one indented object after another.
const records = (text) => JSON.parse(`[${text.trim().replace(/^\}\n\{$/gm, '},{')}]`)

// The module cache is read-only on disk: make it writable, then remove it.
async function clearCaches() {
  for (const dir of [MODCACHE, BUILDCACHE, path.join(WORK, 'gopath')]) {
    if (!existsSync(dir)) continue
    await exec('chmod', ['-R', 'u+w', dir]).catch(() => {})
    await removeDir(dir)
  }
}

// The checker itself, built once from the standard library alone.
await clearCaches()
await mkdir(path.dirname(CHECKER), { recursive: true })
await exec(GO, ['build', '-o', CHECKER, fromRoot('scripts/sweep-types/gomod-typecheck.go')], { env: { ...BASE_ENV, GOPROXY: 'off', GOFLAGS: '' } })
await clearCaches()

const UPSTREAM = 'https://proxy.golang.org'
const escapePath = (modulePath) => modulePath.replace(/[A-Z]/g, (c) => `!${c.toLowerCase()}`)
const published = new Map()
function publishedAt(modulePath, version) {
  const key = `${modulePath}@${version}`
  if (!published.has(key)) published.set(key, fetch(`${UPSTREAM}/${escapePath(modulePath)}/@v/${version}.info`).then(async (r) => (r.ok ? (await r.json()).Time : null), () => null))
  return published.get(key)
}
// Whether this Go can use a module version: the `go` line of its go.mod.
async function usable(modulePath, version) {
  const response = await fetch(`${UPSTREAM}/${escapePath(modulePath)}/@v/${version}.mod`)
  if (!response.ok) return false
  const needs = /^go\s+(\d+(?:\.\d+)*)/m.exec(await response.text())?.[1]
  if (!needs) return true
  const a = needs.split('.').map(Number), b = goVersion.split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0)
  return true
}
// The listed version when it is old enough, else the newest release that is.
async function pickVersion(modulePath, wanted) {
  if (wanted && oldEnough(await publishedAt(modulePath, wanted)) && await usable(modulePath, wanted)) return wanted
  const response = await fetch(`${UPSTREAM}/${escapePath(modulePath)}/@v/list`)
  if (!response.ok) throw new Error(`proxy.golang.org has no module ${modulePath} (${response.status})`)
  const numbers = (version) => version.slice(1).split('+')[0].split('.').map(Number)
  const releases = (await response.text()).split('\n').filter((v) => /^v\d+\.\d+\.\d+(\+incompatible)?$/.test(v)).sort((a, b) => { const x = numbers(a), y = numbers(b); return y[0] - x[0] || y[1] - x[1] || y[2] - x[2] })
  // Old +incompatible tags (v11.0.0+incompatible) sort above a module's real
  // v0/v1 releases: they are used only when there is nothing else.
  const proper = releases.filter((v) => !v.endsWith('+incompatible'))
  // Downwards from the listed version first: some modules carry stray old
  // tags that sort above their current line (k8s.io/client-go v1.5.2 over v0.37).
  const below = (v) => { if (!wanted || !/^v\d+\.\d+\.\d+/.test(wanted)) return true; const x = numbers(v), y = numbers(wanted); return (x[0] - y[0] || x[1] - y[1] || x[2] - y[2]) <= 0 }
  const candidates = proper.length ? proper : releases
  for (const version of [...candidates.filter(below), ...candidates.filter((v) => !below(v))].slice(0, 60)) if (oldEnough(await publishedAt(modulePath, version)) && await usable(modulePath, version)) return version
  if (!releases.length) {
    // A module with no tagged release is known to the proxy by its latest commit.
    const latest = await fetch(`${UPSTREAM}/${escapePath(modulePath)}/@latest`).then((r) => (r.ok ? r.json() : null), () => null)
    if (latest && oldEnough(latest.Time) && await usable(modulePath, latest.Version)) return latest.Version
  }
  throw new Error(`release-age gate: no release of ${modulePath} is at least ${MIN_RELEASE_AGE_DAYS} days old and usable with Go ${goVersion}`)
}
// Every module of the build list a published release at least 7 days old.
async function checkAges(dir, mode) {
  const modules = records(await go(['list', '-m', '-json', `-mod=${mode}`, 'all'], dir)).filter((m) => !m.Main)
  for (let i = 0; i < modules.length; i += 16) {
    await Promise.all(modules.slice(i, i + 16).map(async (m) => {
      if (!m.Version || m.Replace) throw new Error(`release-age gate: ${m.Path} is not a published release`)
      if (!oldEnough(await publishedAt(m.Path, m.Version))) throw new Error(`release-age gate: ${m.Path}@${m.Version} is less than ${MIN_RELEASE_AGE_DAYS} days old`)
    }))
  }
  return modules.length
}

const probeSource = (packages) => `package probe\n${packages.length ? `\nimport (\n${packages.map((p) => `\t_ ${JSON.stringify(p)}\n`).join('')})\n` : ''}`
async function writeProbe(dir, dependency, packages = []) {
  await mkdir(dir, { recursive: true })
  if (!existsSync(path.join(dir, 'go.mod'))) await writeFile(path.join(dir, 'go.mod'), `module probe\n\ngo ${goVersion.split('.').slice(0, 2).join('.')}\n${dependency ? `\nrequire ${dependency.name} ${dependency.version}\n` : ''}`)
  await writeFile(path.join(dir, 'probe.go'), probeSource(packages))
}

const FIELDS = 'ImportPath,Dir,Name,GoFiles,ImportMap,Standard,Module,Error,DepsErrors,Incomplete'
const med = (list, key) => median(list.map((r) => r[key]))
// The two cold figures of a prepared probe directory.
async function coldFigures(dir) {
  const list = path.join(dir, 'packages.json')
  await writeFile(list, await go(['list', '-deps', `-json=${FIELDS}`, '.'], dir, OFFLINE))
  const once = async () => {
    const r = await timed([CHECKER, list], { cwd: dir, env: OFFLINE, timeout: TIMEOUT_MS })
    return { status: r.status, cpuMs: round(r.cpuMs, 2), timeMs: round(r.timeMs, 2), peakRssMb: round(r.peakRssMb, 2), stdout: r.stdout, stderr: r.stderr }
  }
  const probe = await once()
  let summary = null
  try { summary = JSON.parse(probe.stdout) } catch {}
  if (probe.status !== 0) return { failed: summary?.first?.[0] ?? probe.stderr.trim().split('\n')[0] ?? 'type check failed', errors: summary?.errors }
  const runs = [probe]
  for (let i = 1; i < (probe.cpuMs > SLOW_MS ? COLD_RUNS : RUNS); i++) runs.push(await once())
  const strip = ({ stdout, stderr, status, ...r }) => r
  const check = { cpuMs: med(runs, 'cpuMs'), timeMs: med(runs, 'timeMs'), peakRssMb: med(runs, 'peakRssMb'), runs: runs.map(strip) }
  let build = null
  const builds = []
  for (let i = 0; i < BUILD_RUNS; i++) {
    // An empty build cache every time: nothing compiled before is reused.
    await exec('chmod', ['-R', 'u+w', BUILDCACHE]).catch(() => {})
    await removeDir(BUILDCACHE)
    const r = await timed([GO, 'build', '-mod=readonly', '.'], { cwd: dir, env: OFFLINE, timeout: TIMEOUT_MS }).catch((error) => ({ status: -1, stderr: String(error.message) }))
    if (r.status !== 0) { build = { failed: r.stderr.trim().split('\n').filter((l) => !l.startsWith('#'))[0]?.slice(0, 200) ?? 'build failed' }; break }
    builds.push({ cpuMs: round(r.cpuMs, 1), timeMs: round(r.timeMs, 1), peakRssMb: round(r.peakRssMb, 1) })
  }
  if (!build && builds.length) build = { cpuMs: med(builds, 'cpuMs'), timeMs: med(builds, 'timeMs'), peakRssMb: med(builds, 'peakRssMb'), runs: builds }
  return { check, build, summary }
}

const baseDir = path.join(WORK, 'work', '__baseline__')
await removeDir(path.join(WORK, 'work'))
await writeProbe(baseDir, null)
const baseline = await coldFigures(baseDir)
if (baseline.failed || baseline.build?.failed) throw new Error(`baseline failed: ${baseline.failed ?? baseline.build.failed}`)
delete baseline.summary
await clearCaches()
console.error(`go ${goVersion} baseline: check ${baseline.check.cpuMs} ms CPU (spread ${spread(baseline.check.runs.map((r) => r.cpuMs))}), ${baseline.check.peakRssMb} MB${baseline.build ? `; build ${baseline.build.cpuMs} ms CPU, ${baseline.build.peakRssMb} MB` : ''}`)

const skipped = (importPath, modulePath) => importPath.slice(modulePath.length).split('/').some((part) => ['internal', 'testdata', 'vendor', 'example', 'examples', '_examples'].includes(part) || part.startsWith('_') || part.startsWith('.'))

async function measureModule({ name }) {
  const dir = path.join(WORK, 'work', name.replace(/[^\w.-]+/g, '_'))
  await removeDir(dir)
  try {
    let version
    let all
    const result = { listedVersion: listedVersion[name] }
    // A module inside another's internal/ tree can be imported by nobody else.
    if (name.split('/').includes('internal')) return { status: 'no-entry', ...result, detail: 'an internal module: not importable from outside its parent' }
    try {
      version = await pickVersion(name, listedVersion[name])
      result.version = version
      await writeProbe(dir, { name, version })
      // From go.mod files alone, before any source is asked for.
      await checkAges(dir, 'mod')
      all = records(await go(['list', '-e', '-json=ImportPath,Name,GoFiles,CgoFiles,Error', `${name}/...`], dir))
    } catch (error) {
      return { status: 'install-failed', version, ...result, detail: firstError(error) }
    }
    // Which packages have cgo files: listed with cgo on (listing compiles nothing).
    const withCgo = new Set(records(await go(['list', '-e', '-json=ImportPath,CgoFiles', `${name}/...`], dir, { ...ONLINE, CGO_ENABLED: '1' }).catch(() => '')).filter((p) => p.CgoFiles?.length).map((p) => p.ImportPath))
    const own = all.filter((p) => p.ImportPath === name || p.ImportPath.startsWith(name + '/'))
    const importable = own.filter((p) => p.Name !== 'main' && ((p.GoFiles?.length ?? 0) + (p.CgoFiles?.length ?? 0) > 0 || p.Error) && !skipped(p.ImportPath, name))
    // cgo is off, so a package that is only cgo has no file left.
    const cgoOnly = (p) => withCgo.has(p.ImportPath) || /build constraints exclude all Go files|C source files not allowed|cgo/.test(p.Error?.Err ?? '')
    // A root that is only a doc.go says nothing of the module: its packages are used.
    const root = importable.find((p) => p.ImportPath === name && !(p.GoFiles ?? []).every((f) => f === 'doc.go'))
    const depth = (p) => p.ImportPath.split('/').length
    // A package with cgo files is not what its users get with cgo off (a stub,
    // or nothing): it is never measured.
    const usableOnes = importable.filter((p) => !cgoOnly(p))
    if (root && cgoOnly(root)) return { status: 'check-failed', ...result, packagesInModule: own.length, needsCgo: true, detail: 'the module needs cgo, which is off: no C is compiled' }
    const chosen = (root ? [root] : usableOnes.sort((a, b) => depth(a) - depth(b) || a.ImportPath.localeCompare(b.ImportPath)).slice(0, PACKAGE_LIMIT)).map((p) => p.ImportPath)
    result.packagesInModule = own.length
    if (chosen.length === 0) {
      if (importable.some(cgoOnly)) return { status: 'check-failed', ...result, needsCgo: true, detail: 'its packages need cgo, which is off: no C is compiled' }
      return { status: 'no-entry', ...result, detail: own.length ? 'no importable package (only main, internal or test packages)' : 'no package' }
    }
    result.packages = chosen
    const skippedForCgo = importable.filter(cgoOnly).length
    if (skippedForCgo) result.cgoPackagesSkipped = skippedForCgo
    try {
      await writeProbe(dir, { name, version }, chosen)
      // Resolves the imports: go.mod and go.sum are completed and the sources
      // of the tree fetched, every zip through the age-gating proxy.
      await go(['list', '-deps', '-json=ImportPath', '.'], dir)
      result.modules = await checkAges(dir, 'readonly')
    } catch (error) {
      return { status: 'install-failed', ...result, detail: firstError(error) }
    }
    const tree = records(await go(['list', '-e', '-deps', '-json=ImportPath,Standard,Error,Imports', '.'], dir, OFFLINE))
    const full = tree.filter((p) => p.ImportPath !== 'probe')
    const standard = new Set(tree.filter((p) => p.Standard).map((p) => p.ImportPath))
    const broken = tree.filter((p) => p.Error)
    if (broken.length) {
      const needsCgo = broken.some(cgoOnly)
      return { status: 'check-failed', ...result, ...(needsCgo ? { needsCgo: true } : {}), detail: `${broken[0].ImportPath}: ${broken[0].Error.Err.trim().split('\n')[0]}`.slice(0, 300) }
    }
    result.treePackages = tree.length - 1
    result.standardLibraryPackages = tree.filter((p) => p.Standard).length
    let measured
    let std
    try {
      measured = await coldFigures(dir)
      // The reference: a probe that imports only the standard-library packages
      // the tree's modules import, so the standard library is not counted
      // against the module (as Rust's is not: it comes checked).
      if (!measured.failed && STD === 'exclude') {
        const stdImports = [...new Set(full.filter((p) => !p.Standard).flatMap((p) => p.Imports ?? []))].filter((i) => standard.has(i) && i !== 'C').sort()
        const stdDir = dir + '.std'
        await removeDir(stdDir)
        await writeProbe(stdDir, null, stdImports)
        std = await coldFigures(stdDir)
        await removeDir(stdDir)
        if (std.failed) throw new Error(`standard-library reference failed: ${std.failed}`)
      }
    } catch (error) {
      return { status: 'check-failed', ...result, detail: firstError(error) }
    }
    if (measured.failed) return { status: 'check-failed', ...result, errors: measured.errors, detail: String(measured.failed).replaceAll(MODCACHE, '').slice(0, 300) }
    // Minus the standard-library reference (or, with --std=include, minus the
    // empty probe). `wholeTree` is always the figure over the empty probe.
    const added = (kind) => ({
      cpuMs: round(measured[kind].cpuMs - (std ?? baseline)[kind].cpuMs, 1),
      memoryMb: round(measured[kind].peakRssMb - (std ?? baseline)[kind].peakRssMb, 1),
      timeMs: round(measured[kind].timeMs - (std ?? baseline)[kind].timeMs, 1),
      wholeTree: { cpuMs: round(measured[kind].cpuMs - baseline[kind].cpuMs, 1), memoryMb: round(measured[kind].peakRssMb - baseline[kind].peakRssMb, 1) },
      ...(std ? { standardLibrary: { cpuMs: round(std[kind].cpuMs - baseline[kind].cpuMs, 1), memoryMb: round(std[kind].peakRssMb - baseline[kind].peakRssMb, 1) } } : {}),
      ...(kind === 'check' ? { cpuSpreadMs: spread(measured.check.runs.map((r) => r.cpuMs)) } : {}),
      runs: measured[kind].runs,
    })
    const figures = { check: added('check') }
    if (measured.build?.failed) figures.build = { failed: measured.build.failed }
    else if (measured.build && !std?.build?.failed) figures.build = added('build')
    const graded = figures[GRADED]
    if (!graded || graded.failed) return { status: 'check-failed', ...result, detail: `build: ${graded?.failed}`, ...figures }
    result.files = measured.summary.files
    // Elapsed time inside the checker, split: how much of the figure is the
    // standard library the tree imports, and how much the modules themselves.
    result.checkSplit = { standardLibraryMs: round(measured.summary.standardLibraryMs, 1), modulesMs: round(measured.summary.otherMs, 1) }
    return {
      status: 'ok',
      ...result,
      gradedBy: GRADED,
      added: { cpuMs: Math.max(0, graded.cpuMs), memoryMb: Math.max(0, graded.memoryMb) },
      ...figures,
      baseline: { checkCpuMs: baseline.check.cpuMs, checkPeakRssMb: baseline.check.peakRssMb, ...(baseline.build ? { buildCpuMs: baseline.build.cpuMs, buildPeakRssMb: baseline.build.peakRssMb } : {}) },
    }
  } finally {
    if (!has('keep')) {
      await discard(dir)
      await clearCaches().catch((err) => console.error(`could not clear the Go caches: ${err.code ?? err.message}`))
    }
  }
}

const freeGb = async () => { const s = await statfs(WORK); return (s.bavail * s.bsize) / 2 ** 30 }
const header = {
  checker: GRADED === 'check' ? { tool: 'go/types', version: goVersion } : { tool: 'go build', version: goVersion },
  method: { graded: GRADED, standardLibrary: STD === 'exclude' ? 'not counted: minus a probe importing the same standard-library packages' : 'counted', program: 'blank imports of the module root, or of its importable packages', packageLimit: PACKAGE_LIMIT, cgo: 'off', check: 'go/types over the whole tree from source, standard library included', build: 'go build of the probe package, empty GOCACHE, no link' },
  minReleaseAgeDays: MIN_RELEASE_AGE_DAYS,
  memoryKind: 'peak RSS of the checker process (build: of the largest process in the go build tree)',
  scoreBasis: 'added process CPU ms * added peak RSS MB',
  runs: RUNS,
  coldRuns: COLD_RUNS,
  buildRuns: BUILD_RUNS,
  baseline,
}
await sweep({
  out: OUT,
  header,
  targets,
  force: has('force'),
  retryFailed: has('retry-failed'),
  measureOne: measureModule,
  stopWhen: async (done) => {
    if (done % 25) return null
    const free = await freeGb()
    return free < MIN_FREE_GB ? `only ${free.toFixed(1)} GB of disk free (the sweep stops under ${MIN_FREE_GB} GB)` : null
  },
  summary: (r) => (r.status === 'ok' ? `check +${r.check.cpuMs} ms CPU (spread ${r.check.cpuSpreadMs}; whole tree ${r.check.wholeTree.cpuMs}), +${r.check.memoryMb} MB${r.build?.cpuMs !== undefined ? `; build +${(r.build.cpuMs / 1000).toFixed(2)} CPU-s (whole tree ${(r.build.wholeTree.cpuMs / 1000).toFixed(1)}), +${r.build.memoryMb} MB` : r.build?.failed ? '; build failed' : ''}; ${r.packages.length}/${r.packagesInModule} packages, tree ${r.treePackages} (${r.standardLibraryPackages} std; check time std ${r.checkSplit.standardLibraryMs} ms, modules ${r.checkSplit.modulesMs} ms), ${r.modules} modules` : `${r.status}: ${r.detail}`) + ` ${r.version ?? ''}`,
})
if (!has('keep')) {
  await clearCaches()
  await removeDir(path.join(WORK, 'work'))
}
