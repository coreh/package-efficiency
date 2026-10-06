// Measure the type-check footprint of packages: how much a TypeScript
// compiler's time, memory, symbol and file counts grow when a package's types
// are loaded, relative to an empty project. Runs every compiler in runtimes.json
// and writes data/types.json.
// Usage: node scripts/measure-types.mjs <pkg>... | --top=N [--force]
import { execFile } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
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
const versionOverride = flags.find(f => f.startsWith('--version='))?.slice('--version='.length)
if (versionOverride && names.length !== 1) throw new Error('--version requires one package')

const ranked = (await readJson(fromRoot('data/packages.json'), [])).map((p) => p.name)
const targets = top ? ranked.slice(0, top) : names
if (targets.length === 0) {
  console.error('Usage: node scripts/measure-types.mjs <pkg>... | --top=N [--force]')
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
  // The compilers round their own timings to 1 or 10 ms, which is coarser than
  // what a small package adds, so the whole run is timed from outside instead.
  const startedAt = performance.now()
  const { stdout, stderr = '' } = await exec('/usr/bin/time', [process.platform === 'darwin' ? '-l' : '-v', compiler.bin, '-p', dir, '--extendedDiagnostics'], { maxBuffer: 64 << 20 }).catch((e) => e)
  const cpuMatch = /[\d.]+ real\s+([\d.]+) user\s+([\d.]+) sys/.exec(stderr)
  const cpuMs = process.platform === 'darwin'
    ? (cpuMatch ? (Number(cpuMatch[1]) + Number(cpuMatch[2])) * 1000 : NaN)
    : (Number(/User time \(seconds\): ([\d.]+)/.exec(stderr)?.[1]) + Number(/System time \(seconds\): ([\d.]+)/.exec(stderr)?.[1])) * 1000
  if (!Number.isFinite(cpuMs)) throw new Error(`CPU timing unavailable for ${compiler.title}`)
  const wallMs = performance.now() - startedAt
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

async function measurePackage(name) {
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
    version = (await installPinned(dir, [...new Set([...RUNTIME_PACKAGES, name])], versionOverride ? {[name]: versionOverride} : {}))[name]
  } catch (err) {
    return { status: 'install-failed', detail: String(err.stderr ?? err.message).trim().split('\n')[0] }
  }

  let probed = await diagnose(probe, dir)
  if (probed.errors.includes('TS7016')) {
    // Untyped JavaScript: fall back to DefinitelyTyped.
    const typesPackage = typesPackageFor(name)
    try {
      // An earlier version of a package needs the DefinitelyTyped line for its
      // own major version, not the one pinned for the default version.
      await installPinned(dir, [typesPackage], versionOverride ? { [typesPackage]: versionOverride.split('.')[0] } : {})
    } catch {
      return { status: 'untyped', version }
    }
    typesFrom = `${typesPackage}@${await installedVersion(dir, typesPackage)}`
    probed = await diagnose(probe, dir)
  }
  if (probed.errors.includes('TS2307')) return { status: 'no-entry', version }
  if (probed.errors.length) return {status:'typecheck-failed',version,errors:probed.errors}

  const result = { status: 'ok', version, typesFrom, baselines, runtimeTypeVersions }
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
if (versionOverride && !reusable) throw new Error('Refresh the pinned package checks before measuring another version')
const queue = [...new Set([...targets, ...(!reusable ? Object.keys(previous?.packages ?? {}) : [])])].filter((name) => versionOverride || force || !packages[name] || (packages[name].status === 'ok' && !Number.isFinite(packages[name].tsgo?.cpuMs)))
const total = queue.length
let done = 0
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let name; (name = queue.shift()); ) {
      const r = await measurePackage(name)
      if (versionOverride) (versions[name] ??= {})[versionOverride] = r
      else packages[name] = r
      const summary =
        r.status === 'ok'
          ? Object.keys(compilers).map((id) => `${id} +${r[id]?.memoryKb ?? '?'}K +${r[id]?.timeMs ?? '?'}ms`).join(', ') + ` (${r.typesFrom})`
          : r.status
      console.error(`[${++done}/${total}] ${name}: ${summary}`)
    }
  }),
)

const sorted = Object.fromEntries(Object.entries(packages).sort(([a], [b]) => a.localeCompare(b)))
await writeJson(OUT, { compilers: compilerVersions, minReleaseAgeDays: MIN_RELEASE_AGE_DAYS, runtimeTypeVersions, runtimeTypes: RUNTIME_TYPES, scoreBasis: 'sqrt(added CPU ms * added heap MB)', baselines, packages: sorted, versions })
console.log(`wrote data/types.json (${Object.keys(sorted).length} packages)`)
