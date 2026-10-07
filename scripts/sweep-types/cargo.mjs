// Type-check cost of crates.io packages with `cargo check`, the counterpart of
// scripts/measure-types.mjs. Writes data/cargo/types.json.
//
// Usage: node scripts/sweep-types/cargo.mjs <crate>... | --top=N
//        [--force] [--retry-failed] [--runs=11] [--cold-runs=3] [--graded=cold|warm] [--keep] [--out=file]
// --top=N takes the N most used of data/cargo/packages.json and everything in
// data/cargo/picked.json. A run can be stopped and started again: the results
// file is written after every crate, crates already in it are skipped
// (--retry-failed tries the ones that are not `ok` again, --force everything),
// and Ctrl-C finishes the crate in hand.
//
// Generated program: a package that depends on exactly that crate, under a
// fixed name so the library's own name need not be known:
//   [dependencies] pkg = { package = "<name>", version = "=<version>", features = [...] }
//   src/main.rs:   use pkg as _;  fn main() {}
// Features: the crate's defaults, plus the features its own documentation is
// built with when the crate says so in a machine-readable way
// ([package.metadata.docs.rs] `features`, `all-features`,
// `no-default-features`). If the check fails with those, the defaults alone
// are used. `features` in the result says which were used.
//
// Command: cargo check --locked --offline --quiet, CARGO_INCREMENTAL=0 (no
// incremental state is ever written or reused).
//   warm: the first check of the generated crate once its dependency tree is
//         already checked: main.rs is touched so the crate itself is checked
//         again from nothing, --runs times, medians. What every check after
//         the first pays for having the crate as a dependency. Graded only
//         with --graded=warm: for most crates it is a few milliseconds.
//   cold: the first check in an empty target directory: the crate, its whole
//         dependency tree, their build scripts and proc macros. --cold-runs
//         fresh checks, medians. Sources are fetched before, so no network
//         time is in it. THIS IS THE GRADED FIGURE (`added`).
// Baseline: the same package with no dependency and `fn main() {}`; both
// figures are reported minus the baseline's. Process CPU (user + system, every
// rustc and build script in the tree) and the peak RSS of the largest process.
// Each crate and each cold run gets an empty target directory, so nothing
// checked for an earlier crate is reused and the order of a sweep cannot matter.
//
// Classification:
//   ok             the check passes (Rust has no `untyped`)
//   no-entry       the crate has no library or proc-macro target
//   install-failed no release or no dependency resolution inside the age window
//   check-failed   the check fails (a build script that needs a system
//                  library, another platform, a nightly compiler)
// `buildScript` and `procMacro` are recorded: a cold figure can be mostly a
// build script compiling C.
//
// Safety: the lockfile is generated first (resolution reads the index; no
// crate code runs). Every locked crate version must have been published at
// least 7 days ago according to `pubtime` in the crates.io sparse index; a
// version that is too new is pinned back to the newest old-enough release on
// the same semver line, and a version with no publish time counts as too new.
// Only then is anything downloaded (cargo fetch --locked, checksums verified
// by cargo against the lockfile) or compiled. Cargo cannot skip build scripts
// or proc macros: `cargo check` runs them, as scripts/measure-rust-check.mjs
// already does for the adapters.
import { mkdir, readFile, rm, utimes, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { MIN_RELEASE_AGE_DAYS, args, duMb, exec, fromRoot, loadTargets, median, oldEnough, round, spread, sweep, timed } from './lib.mjs'
import { raisePriority } from '../lib/util.mjs'
// Above the usual priority where the machine allows it (see raisePriority).
raisePriority()

const { names, value, has } = args('Usage: node scripts/sweep-types/cargo.mjs <crate>... | --top=N [--force] [--retry-failed] [--runs=11] [--cold-runs=3] [--keep] [--out=file]')
const RUNS = Number(value('runs', 11))
const COLD_RUNS = Number(value('cold-runs', 3))
// Which figure is the entry's `added`.
const GRADED = value('graded', 'cold')
if (!['warm', 'cold'].includes(GRADED)) throw new Error('--graded must be warm or cold')
// A check that runs longer than this is a failure (an all-features tree can be enormous).
const CHECK_TIMEOUT_MS = 15 * 60_000
const WORK = fromRoot('.cache/sweep-types/cargo')
const OUT = value('out') ? path.resolve(value('out')) : fromRoot('data/cargo/types.json')
// Its own CARGO_HOME: the downloads of a sweep stay out of ~/.cargo and no
// user-level cargo configuration applies. rustup still finds the toolchain.
const CARGO_HOME = path.join(WORK, 'home')
const ENV = { ...process.env, CARGO_HOME, RUSTUP_HOME: process.env.RUSTUP_HOME ?? path.join(process.env.HOME, '.rustup'), CARGO_INCREMENTAL: '0', CARGO_TERM_COLOR: 'never', RUSTFLAGS: '' }
const cargo = (argv, cwd, env = {}) => exec('cargo', argv, { cwd, env: { ...ENV, ...env }, maxBuffer: 256 << 20 })

const { targets, listedVersion } = await loadTargets('cargo', names, Number(value('top', 0)))
await mkdir(CARGO_HOME, { recursive: true })
const rust = /\d+\.\d+\.\d+/.exec((await exec('rustc', ['--version'], { env: ENV })).stdout)[0]

// Publish times from the sparse index: one CDN request per crate name gives
// every version with `pubtime`, so there is no one-request-a-second API limit.
const indexCache = new Map()
const indexPath = (name) => {
  const n = name.toLowerCase()
  return n.length === 1 ? `1/${n}` : n.length === 2 ? `2/${n}` : n.length === 3 ? `3/${n[0]}/${n}` : `${n.slice(0, 2)}/${n.slice(2, 4)}/${n}`
}
function versionsOf(name) {
  if (!indexCache.has(name)) {
    indexCache.set(name, (async () => {
      const res = await fetch(`https://index.crates.io/${indexPath(name)}`)
      if (!res.ok) throw new Error(`index.crates.io returned HTTP ${res.status} for ${name}`)
      return (await res.text()).trim().split('\n').map((l) => JSON.parse(l))
    })())
  }
  return indexCache.get(name)
}
// A version without a publish time in the index is treated as too new.
const eligible = (v) => !v.yanked && oldEnough(v.pubtime)
const parse = (v) => v.split('+')[0].split('-')[0].split('.').map(Number)
const cmp = (a, b) => parse(a).reduce((r, n, i) => r || n - parse(b)[i], 0)
// Same semver-compatible line: major, or minor for 0.x, or patch for 0.0.x.
const line = (v) => { const [a, b, c] = parse(v); return a ? `${a}` : b ? `0.${b}` : `0.0.${c}` }

async function pickVersion(name, wanted) {
  const versions = (await versionsOf(name)).filter((v) => eligible(v) && !v.vers.includes('-'))
  return versions.find((v) => v.vers === wanted)?.vers ?? versions.sort((a, b) => cmp(b.vers, a.vers))[0]?.vers ?? null
}

const lockedCrates = async (dir) => [...(await readFile(path.join(dir, 'Cargo.lock'), 'utf8')).matchAll(/\[\[package\]\]\nname = "(.+)"\nversion = "(.+)"\nsource = "registry\+/g)].map(([, name, version]) => ({ name, version }))

// Every locked crate version at least 7 days old, pinning back what is not.
async function enforceAge(dir) {
  const pinned = []
  for (let round = 0; round < 12; round++) {
    const tooNew = []
    for (const c of await lockedCrates(dir)) {
      const entry = (await versionsOf(c.name)).find((v) => v.vers === c.version)
      if (!entry || !eligible(entry)) tooNew.push(c)
    }
    if (tooNew.length === 0) return pinned
    for (const { name, version } of tooNew) {
      const older = (await versionsOf(name)).filter((v) => eligible(v) && !v.vers.includes('-') && line(v.vers) === line(version)).sort((a, b) => cmp(b.vers, a.vers))[0]
      if (!older) throw new Error(`release-age gate: no ${name} release on the ${line(version)} line is ${MIN_RELEASE_AGE_DAYS} days old (locked ${version})`)
      // Pinning one crate back can already have moved another on this list
      // (a derive crate locked to its parent's version): then it is gone from
      // the lockfile and the next round looks again.
      if (!(await lockedCrates(dir)).some((c) => c.name === name && c.version === version)) continue
      await cargo(['update', '-p', `${name}@${version}`, '--precise', older.vers], dir)
      pinned.push(`${name} ${version} -> ${older.vers}`)
    }
  }
  throw new Error('release-age gate: lockfile did not settle')
}

const MAIN = 'use pkg as _;\nfn main() {}\n'
async function writeProject(dir, dependency, features = null) {
  // With features the project is rewritten in place: its lockfile stays.
  if (!features) await rm(dir, { recursive: true, force: true })
  await mkdir(path.join(dir, 'src'), { recursive: true })
  const extra = features ? `${features.noDefault ? ', default-features = false' : ''}${features.list.length ? `, features = ${JSON.stringify(features.list)}` : ''}` : ''
  // The empty [workspace] keeps the package out of the repository's workspace.
  await writeFile(path.join(dir, 'Cargo.toml'), `[package]\nname = "probe"\nversion = "0.0.0"\nedition = "2021"\npublish = false\n\n[dependencies]\n${dependency ? `pkg = { package = "${dependency.name}", version = "=${dependency.version}"${extra} }\n` : ''}\n[workspace]\n`)
  await writeFile(path.join(dir, 'src/main.rs'), dependency ? MAIN : 'fn main() {}\n')
}

const CHECK = ['cargo', 'check', '--locked', '--offline', '--quiet']
async function coldAndWarm(dir) {
  const target = path.join(dir, 'target')
  const options = { cwd: dir, env: { ...ENV, CARGO_TARGET_DIR: target }, timeout: CHECK_TIMEOUT_MS }
  // A fresh target directory per crate and per cold run: nothing checked for
  // an earlier crate can be reused, so the order of a sweep cannot matter.
  const cold = []
  for (let i = 0; i < COLD_RUNS; i++) {
    await rm(target, { recursive: true, force: true })
    const r = await timed(CHECK, options).catch((err) => ({ status: -1, stderr: err.killed ? `error: check ran longer than ${CHECK_TIMEOUT_MS / 60_000} minutes` : String(err.message) }))
    if (r.status !== 0) return { failed: r.stderr.trim().split('\n').filter((l) => /^error/.test(l))[0] ?? r.stderr.trim().split('\n')[0] }
    cold.push({ cpuMs: round(r.cpuMs, 1), timeMs: round(r.timeMs, 1), peakRssMb: round(r.peakRssMb, 1) })
  }
  const targetMb = await duMb(target)
  const main = path.join(dir, 'src/main.rs')
  const runs = []
  for (let i = 0; i < RUNS; i++) {
    await utimes(main, new Date(), new Date())
    const r = await timed(CHECK, options)
    if (r.status !== 0) return { failed: 'warm check failed' }
    runs.push({ cpuMs: round(r.cpuMs, 2), timeMs: round(r.timeMs, 2), peakRssMb: round(r.peakRssMb, 2) })
  }
  await rm(target, { recursive: true, force: true })
  const med = (list, key) => median(list.map((r) => r[key]))
  return {
    cold: { cpuMs: med(cold, 'cpuMs'), timeMs: med(cold, 'timeMs'), peakRssMb: med(cold, 'peakRssMb'), runs: cold },
    warm: { cpuMs: med(runs, 'cpuMs'), timeMs: med(runs, 'timeMs'), peakRssMb: med(runs, 'peakRssMb'), runs },
    targetMb,
  }
}

const baseDir = path.join(WORK, 'work', '__baseline__')
await writeProject(baseDir, null)
await cargo(['generate-lockfile'], baseDir)
const baseline = await coldAndWarm(baseDir)
if (baseline.failed) throw new Error(`baseline failed: ${baseline.failed}`)
delete baseline.targetMb
console.error(`baseline: cold ${baseline.cold.cpuMs} ms CPU, ${baseline.cold.peakRssMb} MB; warm ${baseline.warm.cpuMs} ms CPU (spread ${spread(baseline.warm.runs.map((r) => r.cpuMs))}), ${baseline.warm.peakRssMb} MB`)

async function measurePackage({ name }) {
  const dir = path.join(WORK, 'work', name)
  try {
    let version
    let pinnedBack
    try {
      version = await pickVersion(name, listedVersion[name])
      if (!version) throw new Error(`release-age gate: no ${name} release at least ${MIN_RELEASE_AGE_DAYS} days old`)
      await writeProject(dir, { name, version })
      // Resolution only reads the index; nothing is downloaded or run yet.
      await cargo(['generate-lockfile'], dir)
      pinnedBack = await enforceAge(dir)
    } catch (err) {
      return { status: 'install-failed', version, listedVersion: listedVersion[name], detail: String(err.stderr || err.message).trim().split('\n').filter((l) => /error|gate/i.test(l))[0]?.slice(0, 300) ?? String(err.message).slice(0, 300) }
    }
    const result = { version, listedVersion: listedVersion[name], lockedCrates: (await lockedCrates(dir)).length, pinnedBack }
    // What the package offers to `use`: a library or proc-macro target.
    const metadata = JSON.parse((await cargo(['metadata', '--format-version', '1', '--locked'], dir)).stdout)
    const pkg = metadata.packages.find((p) => p.name === name && p.version === version)
    const lib = pkg?.targets.find((t) => t.kind.some((k) => ['lib', 'rlib', 'dylib', 'cdylib', 'staticlib', 'proc-macro'].includes(k)))
    if (!lib) return { status: 'no-entry', ...result, detail: 'no library target' }
    result.libName = lib.name
    result.procMacro = lib.kind.includes('proc-macro')
    result.buildScript = pkg.targets.some((t) => t.kind.includes('custom-build'))
    // Features the crate's documentation is built with, if it says so.
    const docs = pkg.metadata?.docs?.rs ?? pkg.metadata?.['docs.rs'] ?? null
    const declared = Object.keys(pkg.features ?? {}).filter((f) => f !== 'default')
    let features = null
    if (docs && (docs['all-features'] || docs.features?.length || docs['no-default-features'])) {
      const list = docs['all-features'] ? declared : (docs.features ?? []).filter((f) => declared.includes(f))
      if (list.length || docs['no-default-features']) features = { list, noDefault: Boolean(docs['no-default-features']) && !docs['all-features'], source: docs['all-features'] ? 'docs.rs all-features' : 'docs.rs features' }
    }
    // Crates actually compiled for this host (the lockfile also lists other platforms').
    const compiled = async () => new Set((await cargo(['tree', '--locked', '--offline', '--edges', 'normal,build', '--prefix', 'none', '--format', '{p}'], dir)).stdout.trim().split('\n').map((l) => l.replace(/ \(\*\)$/, ''))).size - 1
    // Other features bring other crates in, so the lockfile is resolved again
    // and goes through the release-age gate again before anything is fetched.
    const prepare = async (chosen) => {
      if (chosen) {
        await writeProject(dir, { name, version }, chosen)
        await rm(path.join(dir, 'Cargo.lock'), { force: true })
        await cargo(['generate-lockfile'], dir)
        result.pinnedBack = await enforceAge(dir)
        result.lockedCrates = (await lockedCrates(dir)).length
      }
      await cargo(['fetch', '--locked'], dir)
      result.compiledCrates = await compiled()
    }
    let measured = null
    if (features) {
      try {
        await prepare(features)
        measured = await coldAndWarm(dir)
      } catch (err) {
        measured = { failed: String(err.stderr || err.message).trim().split('\n').filter((l) => /error|gate/i.test(l))[0] ?? String(err.message).split('\n')[0] }
      }
      if (measured.failed) {
        // Not checkable as documented (a nightly-only feature, say): defaults.
        result.featuresTried = { source: features.source, count: features.list.length, failed: measured.failed.slice(0, 200) }
        measured = null
      }
    }
    if (!measured) {
      try {
        await prepare(features ? { list: [], noDefault: false } : null)
      } catch (err) {
        return { status: 'install-failed', ...result, detail: String(err.stderr || err.message).trim().split('\n').at(-1).slice(0, 300) }
      }
      features = null
      measured = await coldAndWarm(dir)
    }
    result.features = features ? { default: !features.noDefault, extra: features.list.length > 40 ? `${features.list.length} features` : features.list, source: features.source } : { default: true, extra: [], source: 'default' }
    if (measured.failed) return { status: 'check-failed', ...result, detail: measured.failed.slice(0, 300) }
    const added = (kind) => ({
      cpuMs: round(measured[kind].cpuMs - baseline[kind].cpuMs, 1),
      memoryMb: round(measured[kind].peakRssMb - baseline[kind].peakRssMb, 1),
      timeMs: round(measured[kind].timeMs - baseline[kind].timeMs, 1),
      ...(kind === 'warm' ? { cpuSpreadMs: spread(measured.warm.runs.map((r) => r.cpuMs)) } : {}),
      runs: measured[kind].runs,
    })
    const figures = { cold: added('cold'), warm: added('warm') }
    const graded = figures[GRADED]
    return { status: 'ok', ...result, targetMb: measured.targetMb, gradedBy: GRADED, added: { cpuMs: Math.max(0, graded.cpuMs), memoryMb: Math.max(0, graded.memoryMb) }, ...figures, baseline: { coldCpuMs: baseline.cold.cpuMs, coldPeakRssMb: baseline.cold.peakRssMb, warmCpuMs: baseline.warm.cpuMs, warmPeakRssMb: baseline.warm.peakRssMb } }
  } finally {
    if (!has('keep')) await rm(dir, { recursive: true, force: true })
  }
}

const header = {
  checker: { tool: GRADED === 'warm' ? 'cargo check, dependencies already checked' : 'cargo check', version: rust },
  method: { program: MAIN, features: 'default plus docs.rs metadata', graded: GRADED, env: { CARGO_INCREMENTAL: '0' } },
  minReleaseAgeDays: MIN_RELEASE_AGE_DAYS,
  memoryKind: 'peak RSS of the largest process in the cargo tree (rustc)',
  scoreBasis: 'added process CPU ms * added peak RSS MB',
  runs: RUNS,
  coldRuns: COLD_RUNS,
  baseline,
}
await sweep({
  out: OUT,
  header,
  targets,
  force: has('force'),
  retryFailed: has('retry-failed'),
  measureOne: measurePackage,
  summary: (r) => (r.status === 'ok' ? `warm +${r.warm.cpuMs} ms CPU (spread ${r.warm.cpuSpreadMs}), +${r.warm.memoryMb} MB; cold +${(r.cold.cpuMs / 1000).toFixed(2)} CPU-s, +${r.cold.memoryMb} MB peak; ${r.compiledCrates} crates, features ${r.features.source}${r.featuresTried ? ' (documented ones failed)' : ''}, target ${r.targetMb} MB${r.pinnedBack.length ? `; pinned back ${r.pinnedBack.length}` : ''}` : `${r.status}: ${r.detail}`) + ` v${r.version ?? '?'}`,
})
