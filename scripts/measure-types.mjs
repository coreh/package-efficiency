// Measure the type-check footprint of packages: how much a TypeScript
// compiler's time, memory, symbol and file counts grow when a package's types
// are loaded, relative to an empty project. Runs every compiler in runtimes.json
// and writes data/types.json.
// Usage: node scripts/measure-types.mjs <pkg>... | --top=N [--force]
//        node scripts/measure-types.mjs <pkg> --version=<x.y.z>   (one other version)
// A package's other release lines (versions.json `activeVersions`) are checked
// along with it.
//
// A long run (--top=1000 takes hours) can be stopped and started again:
//   - the results file is written after every package, so nothing is lost;
//   - packages already in it are skipped, including the ones that could not
//     be measured (pass --retry-failed to try those again);
//   - Ctrl-C finishes the package in hand, saves and exits.
// --top measures packages outside the edition, so it does not pin their
// versions in versions.json and deletes each one's files when it is done.
// --rebuild-every=N rebuilds the site after every N packages, between
// measurements, never during one.
// --top=N also takes every package of picked.json (added by hand, outside the
// most used).
//
// JSR: node scripts/measure-types.mjs --top=N --ecosystem=jsr sweeps
// data/jsr/packages.json and data/jsr/picked.json the same way (names can be
// given instead of --top). Results go into the same data/types.json under the
// JSR name, marked `registry: "jsr"`. A JSR package pinned in versions.json
// (one with a benchmark adapter) is installed at its pin as before; any other
// is installed at its newest release at least seven days old, through JSR's
// npm-compatible registry, without being pinned. A JSR name that is also on
// the npm list is left to the npm sweep: one key cannot hold both.
import { execFile, spawnSync } from 'node:child_process'
import os from 'node:os'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { installPinned, installedVersion, MIN_RELEASE_AGE_DAYS } from './lib/npm.mjs'
import { fromRoot, loadConfig, median, readJson, writeJson } from './lib/util.mjs'

const exec = promisify(execFile)

const CACHE = fromRoot('.cache/types')
const OUT = fromRoot('data/types.json')
const RUNTIME_TYPES = ['node', 'bun', 'deno']
const RUNTIME_PACKAGES = RUNTIME_TYPES.map(name => `@types/${name}`)
const RUNS = 11
// One at a time: time is measured, and parallel compiles would distort it.
const CONCURRENCY = 1

const flags = process.argv.slice(2).filter((a) => a.startsWith('--'))
const names = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const top = Number(flags.find((f) => f.startsWith('--top='))?.split('=')[1] ?? 0)
const force = flags.includes('--force')
const retryFailed = flags.includes('--retry-failed')
const rebuildEvery = Number(flags.find((f) => f.startsWith('--rebuild-every='))?.split('=')[1] ?? 0)
// A sweep of the most used packages: look, record, leave no trace.
const sweep = top > 0
const versionOverride = flags.find(f => f.startsWith('--version='))?.slice('--version='.length)
if (versionOverride && names.length !== 1) throw new Error('--version requires one package')

const ecosystemId = flags.find((f) => f.startsWith('--ecosystem='))?.split('=')[1] ?? 'npm'
if (!['npm', 'jsr'].includes(ecosystemId)) throw new Error('--ecosystem must be npm or jsr')
const jsrMode = ecosystemId === 'jsr'
const listNames = async (dir) => [...(await readJson(fromRoot(dir, 'packages.json'), [])), ...(await readJson(fromRoot(dir, 'picked.json'), []))].map((p) => p.name)
const ranked = (await readJson(fromRoot(jsrMode ? 'data/jsr' : 'data', 'packages.json'), [])).map((p) => p.name)
const picked = (await readJson(fromRoot(jsrMode ? 'data/jsr' : 'data', 'picked.json'), [])).map((p) => p.name)
// JSR packages pinned in the edition go through installPinned, as always.
const jsrPins = (await readJson(fromRoot('versions.json'), {})).jsr ?? {}
const onNpmList = jsrMode ? new Set(await listNames('data')) : new Set()
const sameNameOnNpm = (name) => jsrMode && onNpmList.has(name) && !jsrPins[name]
const wanted = top ? [...new Set([...ranked.slice(0, top), ...picked])] : names
const targets = wanted.filter((name) => !sameNameOnNpm(name))
for (const name of wanted.filter(sameNameOnNpm)) console.error(`${name}: also on the npm list; left to the npm sweep`)
if (targets.length === 0) {
  console.error('Usage: node scripts/measure-types.mjs <pkg>... | --top=N [--ecosystem=jsr] [--force]')
  process.exit(1)
}

const { compilers } = await loadConfig()

const typesPackageFor = (name) => `@types/${name.replace(/^@/, '').replace('/', '__')}`
const isTypesPackage = (name) => name.startsWith('@types/')

async function writeProject(dir, source, types = []) {
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'package.json'), '{"private":true}\n')
  await writeFile(path.join(dir, 'entry.ts'), source + '\n')
  await writeFile(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        types: [...new Set([...RUNTIME_TYPES, ...types])],
        target: 'es2022',
        lib: ['es2022'],
        module: 'esnext',
        moduleResolution: 'bundler',
      },
      files: ['entry.ts'],
    }),
  )
}

async function diagnose(compiler, dir) {
  // The compilers round their own timings to 1 or 10 ms, and /usr/bin/time
  // prints CPU only to 10 ms, both coarser than what a small package adds. So
  // the run is timed with harness/checkers/time.py, which waits on the child
  // and reads its CPU time to the microsecond.
  const timed = await exec('/opt/homebrew/bin/python3', [fromRoot('harness/checkers/time.py'), compiler.bin, '-p', dir, '--extendedDiagnostics'], { maxBuffer: 64 << 20 }).catch((e) => e)
  let run
  try { run = JSON.parse(timed.stdout) } catch { throw new Error(`CPU timing unavailable for ${compiler.title}`) }
  const { stdout, cpuMs, timeMs: wallMs } = run
  if (!Number.isFinite(cpuMs)) throw new Error(`CPU timing unavailable for ${compiler.title}`)
  const num = (label) => Number(new RegExp(`^${label}:\\s+([\\d.]+)`, 'm').exec(stdout ?? '')?.[1] ?? NaN)
  return {
    files: num('Files'),
    symbols: num('Symbols'),
    types: num('Types'),
    instantiations: num('Instantiations'),
    memoryKb: num('Memory used'),
    timeMs: wallMs,
    cpuMs,
    errors: [...(stdout ?? '').matchAll(/error (TS\d+)/g)].map((m) => m[1]),
  }
}

// Counts are deterministic; time and memory are not, so take their medians.
async function measure(compiler, dir) {
  const runs = []
  for (let i = 0; i < RUNS; i++) runs.push(await diagnose(compiler, dir))
  return { ...runs[0], memoryKb: median(runs.map((r) => r.memoryKb)), timeMs: median(runs.map((r) => r.timeMs)), cpuMs: median(runs.map((r) => r.cpuMs)) }
}

const baselineDir = path.join(CACHE, '__baseline__')
await writeProject(baselineDir, 'export {}')
const runtimeTypeVersions = await installPinned(baselineDir, RUNTIME_PACKAGES)
// Confirm that all three environments are actually available, rather than
// merely installed. This probe is excluded from the baseline measurements.
await writeProject(baselineDir, 'export const runtimeValues: [number, string, string] = [process.pid, Bun.version, Deno.version.deno]')
for (const compiler of Object.values(compilers)) {
  const probe = await diagnose(compiler, baselineDir)
  if (probe.errors.length) throw new Error(`Runtime typings unavailable: ${probe.errors.join(', ')}`)
}
await writeProject(baselineDir, 'export {}')
const baselines = {}
for (const [id, compiler] of Object.entries(compilers)) {
  const { errors, ...baseline } = await measure(compiler, baselineDir)
  if (errors.length) throw new Error(`Runtime typing baseline failed: ${errors.join(', ')}`)
  baselines[id] = baseline
}

// A JSR package outside the edition: the same steps as installJsr in
// scripts/lib/npm.mjs (JSR's version list, the seven-day gate, the npm alias
// through npm.jsr.io with --min-release-age and --ignore-scripts), but without
// pinning it in versions.json, as a sweep must not.
async function installJsrUnpinned(dir, name) {
  const [, scope, pkg] = /^@([^/]+)\/(.+)$/.exec(name) ?? []
  if (!scope) throw new Error(`Invalid JSR name: ${name}`)
  const response = await fetch(`https://api.jsr.io/scopes/${scope}/packages/${pkg}/versions`)
  if (!response.ok) throw new Error(`JSR metadata: ${response.status}`)
  const cutoff = Date.now() - MIN_RELEASE_AGE_DAYS * 86400000
  const eligible = (await response.json()).items
    .filter((v) => !v.yanked && /^\d+\.\d+\.\d+$/.test(v.version) && Date.parse(v.createdAt) < cutoff)
    .sort((a, b) => b.version.localeCompare(a.version, 'en', { numeric: true }))
  const version = eligible[0]?.version
  if (!version) throw new Error(`No eligible JSR version for ${name}`)
  await writeFile(path.join(dir, '.npmrc'), '@jsr:registry=https://npm.jsr.io\n')
  await exec('npm', ['install', `--min-release-age=${MIN_RELEASE_AGE_DAYS}`, '--ignore-scripts', '--no-audit', '--no-fund', '--silent', `${name}@npm:@jsr/${scope}__${pkg}@${version}`], { cwd: dir })
  return version
}
// Measured as a JSR package outside the edition: asked for with
// --ecosystem=jsr, or already recorded as one (when everything is measured
// again after a compiler change).
const jsrUnpinned = (name) => !jsrPins[name] && !isTypesPackage(name) && (jsrMode || previous?.packages?.[name]?.registry === 'jsr')

// Types from DefinitelyTyped are not the package's own project's: marked, as
// the sweeps of the other registries mark theirs. An @types package measured
// as itself (`self`) is its own project.
const communityTyped = (result) => typeof result.typesFrom === 'string' && result.typesFrom.startsWith('@types/')

async function measurePackage(name) {
  const result = await measureOne(name)
  if (communityTyped(result)) result.communityTypes = true
  return jsrUnpinned(name) ? { ...result, registry: 'jsr' } : result
}

async function measureOne(name) {
  const viaJsr = jsrUnpinned(name)
  const dir = path.join(CACHE, name.replace('/', '__') + (versionOverride ? `@${versionOverride}` : ''))
  const importSource = `import type * as pkg from ${JSON.stringify(name)}\nexport type T = typeof pkg`
  // tsgo is the stricter resolver of the two, so it decides where types come from.
  const probe = Object.values(compilers).at(-1)

  let typesFrom
  let version
  try {
    if (isTypesPackage(name)) {
      // Loaded the way consumers get them: as an ambient `types` entry.
      await writeProject(dir, 'export {}', [name.slice('@types/'.length)])
      typesFrom = 'self'
    } else {
      await writeProject(dir, importSource)
      typesFrom = 'bundled'
    }
    if (viaJsr) {
      await installPinned(dir, RUNTIME_PACKAGES, {}, { pin: !sweep })
      version = await installJsrUnpinned(dir, name)
    } else version = (await installPinned(dir, [...new Set([...RUNTIME_PACKAGES, name])], versionOverride ? {[name]: versionOverride} : {}, { pin: !sweep }))[name]
  } catch (err) {
    return { status: 'install-failed', detail: String(err.stderr ?? err.message).trim().split('\n')[0] }
  }

  let probed = await diagnose(probe, dir)
  if (probed.errors.includes('TS7016')) {
    // DefinitelyTyped describes npm packages, not JSR ones.
    if (viaJsr) return { status: 'untyped', version }
    // Untyped JavaScript: fall back to DefinitelyTyped.
    const typesPackage = typesPackageFor(name)
    try {
      // An earlier version of a package needs the DefinitelyTyped line for its
      // own major version, not the one pinned for the default version.
      await installPinned(dir, [typesPackage], versionOverride ? { [typesPackage]: versionOverride.split('.')[0] } : {}, { pin: !sweep })
    } catch {
      return { status: 'untyped', version }
    }
    typesFrom = `${typesPackage}@${await installedVersion(dir, typesPackage)}`
    probed = await diagnose(probe, dir)
  }
  if (probed.errors.includes('TS2307')) return { status: 'no-entry', version }
  if (probed.errors.length) return {status:'typecheck-failed',version,errors:probed.errors}

  // The machine's load when measured: a figure taken on a busy machine can be
  // found and measured again later.
  const result = { status: 'ok', version, typesFrom, baselines, runtimeTypeVersions, load: Number(os.loadavg()[0].toFixed(2)), measuredAt: new Date().toISOString() }
  for (const [id, compiler] of Object.entries(compilers)) {
    const measured = await measure(compiler, dir)
    if (measured.errors.length) return {status:'typecheck-failed',version,compiler:id,errors:measured.errors}
    if (Number.isNaN(measured.memoryKb) || !Number.isFinite(measured.cpuMs)) {
      result[id] = null
      continue
    }
    const base = baselines[id]
    result[id] = {
      files: measured.files - base.files,
      symbols: measured.symbols - base.symbols,
      types: measured.types - base.types,
      instantiations: measured.instantiations - base.instantiations,
      memoryKb: measured.memoryKb - base.memoryKb,
      timeMs: Number((measured.timeMs - base.timeMs).toFixed(1)),
      cpuMs: Number((measured.cpuMs - base.cpuMs).toFixed(1)),
    }
  }
  return result
}

const compilerVersions = Object.fromEntries(Object.entries(compilers).map(([id, c]) => [id, c.version]))
const previous = await readJson(OUT, null)
// Measurements are only comparable under the same compiler versions.
const reusable = JSON.stringify(previous?.compilers) === JSON.stringify(compilerVersions) && JSON.stringify(previous?.runtimeTypeVersions) === JSON.stringify(runtimeTypeVersions)
const packages = reusable ? previous.packages : {}
for (const measured of Object.values(packages)) {
  if (measured.status === 'ok' && !measured.baselines) {
    measured.baselines = previous.baselines
    measured.runtimeTypeVersions = previous.runtimeTypeVersions
  }
}

const versions = reusable ? (previous.versions ?? {}) : {}
// Results recorded before the mark existed get it from what they record.
for (const measured of [...Object.values(packages), ...Object.values(versions).flatMap((byVersion) => Object.values(byVersion))]) if (communityTyped(measured)) measured.communityTypes = true
if (versionOverride && !reusable) throw new Error('Refresh the pinned package checks before measuring another version')
const queue = [...new Set([...targets, ...(!reusable ? Object.keys(previous?.packages ?? {}) : [])])].filter((name) => versionOverride || force || !packages[name] || (retryFailed && packages[name].status !== 'ok') || (packages[name].status === 'ok' && !Number.isFinite(packages[name].tsgo?.cpuMs)))
const total = queue.length
let done = 0
const save = async () => {
  const ordered = Object.fromEntries(Object.entries(packages).sort(([a], [b]) => a.localeCompare(b)))
  await writeJson(OUT, { compilers: compilerVersions, minReleaseAgeDays: MIN_RELEASE_AGE_DAYS, runtimeTypeVersions, runtimeTypes: RUNTIME_TYPES, scoreBasis: 'added CPU ms * added heap MB', baselines, packages: ordered, versions })
}
let stopping = false
process.on('SIGINT', () => {
  if (stopping) process.exit(130)
  stopping = true
  console.error('\nStopping after the package in hand. Run the same command again to carry on.')
})
const started = Date.now()
const left = () => {
  const perPackage = (Date.now() - started) / Math.max(done, 1)
  const minutes = Math.round((perPackage * (total - done)) / 60_000)
  return minutes >= 90 ? `${(minutes / 60).toFixed(1)} h left` : `${minutes} min left`
}
for (let name; !stopping && (name = queue.shift()); ) {
  const r = await measurePackage(name)
  if (versionOverride) (versions[name] ??= {})[versionOverride] = r
  else packages[name] = r
  await save()
  if (sweep) await rm(path.join(CACHE, name.replace('/', '__')), { recursive: true, force: true })
  const summary =
    r.status === 'ok'
      ? Object.keys(compilers).map((id) => `${id} +${r[id]?.memoryKb ?? '?'}K +${r[id]?.timeMs ?? '?'}ms`).join(', ') + ` (${r.typesFrom})`
      : r.status
  console.error(`[${++done}/${total}] ${name}: ${summary}${total > 20 ? `  (${left()})` : ''}`)
  if (rebuildEvery && done % rebuildEvery === 0 && !stopping) {
    // Between packages, so the build never runs beside a measurement.
    const build = spawnSync('npm', ['run', 'build', '--silent'], { cwd: fromRoot(), stdio: ['ignore', 'ignore', 'inherit'] })
    console.error(build.status === 0 ? `site rebuilt with ${Object.keys(packages).length} packages checked` : 'site rebuild failed; carrying on')
  }
}

await save()
console.log(`wrote data/types.json (${Object.keys(packages).length} packages)${stopping || queue.length ? `, ${queue.length} still to do` : ''}`)

// The other release lines listed for a package under `activeVersions` in
// versions.json (a pre-release, an older major) are checked with it: each by
// a run of this script for that one version. One that already has a result
// is skipped unless --force is given.
if (!versionOverride && !sweep && !stopping) {
  const active = (await readJson(fromRoot('versions.json'), {})).activeVersions?.npm ?? {}
  for (const name of targets) {
    for (const version of active[name] ?? []) {
      const stored = versions[name]?.[version]
      if (!force && stored && !(retryFailed && stored.status !== 'ok')) continue
      console.error(`\n${name} ${version}, also current:`)
      spawnSync(process.execPath, [fromRoot('scripts/measure-types.mjs'), name, `--version=${version}`], { cwd: fromRoot(), stdio: 'inherit', env: process.env })
    }
  }
}
