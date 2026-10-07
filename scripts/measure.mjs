// Measure every adapter of one task on every runtime it supports, writing one
// raw result file per (adapter, runtime) under results/.
// Usage: node scripts/measure.mjs <category>/<task> [--only=a,b] [--runtimes=node,bun] [--reps=3] [--force] [--keep-existing] [--retry-failed]
//        node scripts/measure.mjs <category>/<task> --check     (try the adapters; record nothing)
//        node scripts/measure.mjs <category>/<task> --only=<package> --version=<x.y.z>
// The second form measures another version of one npm package, for its
// history. Rankings always use the version pinned in versions.json.
import assert from 'node:assert/strict'
import { prepareNativeHttp } from './lib/native-http.mjs'
import { execFileSync } from 'node:child_process'
import { existsSync, globSync } from 'node:fs'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { HARNESS_VERSION, measureBaseline, measureServer, measureOperation, measureStartup } from '../harness/supervisor.mjs'
import { installPinned, installJsr } from './lib/npm.mjs'
import { binaryInstall, nodeInstall } from './lib/install-size.mjs'
import { prepareApp } from './lib/apps.mjs'
import { adapterFingerprint, staleReason, taskInputs } from './lib/tasks.mjs'
import { ROOT, fromRoot, loadConfig, machine, median, readJson, writeJson } from './lib/util.mjs'
import { raisePriority } from './lib/util.mjs'
// Above the usual priority where the machine allows it (see raisePriority).
raisePriority()

const argv = process.argv.slice(2)
const taskId = argv.find((a) => !a.startsWith('--'))
const flag = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const only = flag('only')?.split(',')
const onlyRuntimes = flag('runtimes')?.split(',')
const reps = Number(flag('reps') ?? 3)
const force = argv.includes('--force')
// A result that failed (a crash, a timeout) is kept and not tried again,
// unless this is given.
const retryFailed = argv.includes('--retry-failed')
// Keep every result that is already there, whatever has changed since it was
// measured: change tracking is skipped. The opposite of --force.
const keepExisting = argv.includes('--keep-existing')
// --check runs every adapter through the task's correctness checks and one
// short round, to see that it works, and records nothing: for trying an
// adapter while writing it, on a machine that is not idle.
const check = argv.includes('--check')
let failures = 0
const versionOverride = flag('version')
if (versionOverride && only?.length !== 1) {
  console.error('--version needs --only=<one package>')
  process.exit(1)
}
if (!Number.isInteger(reps) || reps < 1) throw new Error("--reps must be a positive integer")
if (!taskId) {
  console.error('Usage: node scripts/measure.mjs <category>/<task> [--only=a,b] [--runtimes=node,bun] [--reps=3] [--force] [--keep-existing] [--retry-failed]')
  process.exit(1)
}

const taskDir = fromRoot('benchmarks', taskId)
const task = await readJson(path.join(taskDir, 'task.json'))
const scenario = await import(pathToFileURL(path.join(taskDir, 'scenario.mjs')).href)
const { requests } = scenario
const isOperation = task.kind === 'sync-operation'
const config = await loadConfig()
const RUNNER = fromRoot('harness/js/runner.mjs')
const GO_NO_PREPARE = 'package main\nfunc prepare(v any) any { return v }\n'

// A startup task launches the server anew for each sample; see measureStartup.
const isStartup = task.kind === 'server-startup'
const measurer = isOperation ? measureOperation : isStartup ? measureStartup : measureServer
if (!isOperation && !isStartup && task.kind !== 'http-server') throw new Error(`no driver for task kind "${task.kind}" yet`)

// What this task's figures depend on. A stored result stands only while all
// of it is unchanged; otherwise the whole task is measured again, since its
// entries are graded against each other.
const inputs = await taskInputs(taskId, { config, machine: machine() })
const said = new Set()
async function stands(file) {
  if (force || !existsSync(file)) return false
  const stored = await readJson(file)
  if (stored.harness !== HARNESS_VERSION) return false
  const reason = keepExisting ? null : staleReason(stored.inputs, inputs)
  if (reason) {
    if (!said.has(reason)) console.error(`measuring again: ${reason}`)
    said.add(reason)
    return false
  }
  return !(retryFailed && stored.status && stored.status !== 'ok')
}

const stamp = (runtime, runtimeVersion) => ({
  runtime,
  runtimeVersion,
  machine: machine(),
  harness: HARNESS_VERSION,
  inputs,
  measuredAt: new Date().toISOString(),
})

const jsIds = Object.keys(config.runtimes).filter(id => (config.runtimes[id].language ?? 'javascript') === 'javascript')
const verifyResults = scenario.verifyResults ?? (outputs => assert.deepEqual(outputs, scenario.cases.map(c => c.expected)))
const selected = (runtimeId) => !onlyRuntimes || onlyRuntimes.includes(runtimeId)

// --- Rust -------------------------------------------------------------------

let cargoChecked = false
function cargoBuild(crate, bin, features) {
  if (!cargoChecked) {
    execFileSync(process.execPath, ['scripts/check-cargo-age.mjs'], { cwd: ROOT, stdio: 'inherit' })
    cargoChecked = true
  }
  // One crate per invocation: building the workspace at once would merge
  // feature flags across adapters and change the binaries being measured.
  console.error(`building ${bin ?? crate}`)
  execFileSync('cargo', ['build', '--locked', '--release', '--quiet', '-p', crate, ...(bin ? ['--bin', bin] : []), ...(features ? ['--features', features] : [])], {
    cwd: ROOT,
    stdio: 'inherit',
  })
  return fromRoot('.cache/cargo-target/release', bin ?? crate)
}

// The version of a crate that an adapter is built against. The lock file can
// hold two versions of one crate (other adapters may pin an older one), and
// then the adapter's own entry names which it uses ("brotli 9.0.0").
async function lockedCrateVersion(name, adapterCrate) {
  const lock = await readFile(fromRoot('Cargo.lock'), 'utf8')
  const own = adapterCrate && new RegExp(`name = "${adapterCrate}"\\nversion = ".+"\\n(?:source = ".+"\\n)?(?:checksum = ".+"\\n)?dependencies = \\[([^\\]]*)\\]`).exec(lock)?.[1]
  const named = own && new RegExp(`"${name} ([^" ]+)`).exec(own)?.[1]
  return named ?? new RegExp(`name = "${name}"\\nversion = "(.+)"`).exec(lock)?.[1] ?? null
}

// --- Baselines --------------------------------------------------------------

// --force measures baselines again only when a whole task is measured: with
// --only it is about those entries, and a current baseline is kept.
const forceBaselines = force && !only

async function baseline(runtimeId, launch) {
  if (check) return
  const file = fromRoot('results/_baseline', `${runtimeId}.json`)
  // Baselines are shared by every task, so they depend only on the harness,
  // the runtime's version and the machine.
  const stored = !forceBaselines && existsSync(file) ? await readJson(file) : null
  if (stored && stored.harness === HARNESS_VERSION && (keepExisting || (stored.inputs?.harness === inputs.harness && stored.inputs?.machine === inputs.machine && stored.runtimeVersion === launch.version))) return
  const runs = []
  for (let i = 0; i < reps; i++) runs.push(await measureBaseline(launch))
  await writeJson(file, { ...stamp(runtimeId, launch.version), runs })
  console.error(`baseline ${runtimeId}: ${(runs[0].peakRssBytes / 2 ** 20).toFixed(1)} MB peak`)
}

// The warm baseline of an operation task on one runtime: the harness run with
// a do-nothing adapter over the task's own fixtures and rounds. What a runtime
// holds after that (its warmed-up machinery, the fixtures, the harness) is not
// the package's, so package memory is counted above it rather than above an
// idle process. Measured once per task and runtime, and kept while the
// harness, the task, the machine and the runtime's version stay the same.
const warmBaselines = new Map()
async function warmBaseline(runtimeId, launch) {
  if (warmBaselines.has(runtimeId)) return warmBaselines.get(runtimeId)
  const file = fromRoot('results/_baseline', taskId, `${runtimeId}.json`)
  const stored = !forceBaselines && existsSync(file) ? await readJson(file) : null
  if (stored && stored.harness === HARNESS_VERSION && (keepExisting || (stored.inputs?.harness === inputs.harness && stored.inputs?.task === inputs.task && stored.inputs?.machine === inputs.machine && stored.runtimeVersion === launch.version))) {
    warmBaselines.set(runtimeId, stored)
    return stored
  }
  const runs = []
  for (let i = 0; i < reps; i++) {
    const run = await measureOperation({ ...launch, load: { ...task.load, cycle: scenario.cases?.length }, verifyResults: () => {} })
    if (run.status !== 'ok') {
      console.error(`warm baseline ${runtimeId}: ${run.status}: ${String(run.error).split('\n')[0]}; using the idle baseline`)
      warmBaselines.set(runtimeId, null)
      return null
    }
    runs.push({ rssBytes: run.rssAfterLoadBytes, footprintBytes: run.footprintAfterLoadBytes, heapUsedBytes: run.heap.warmBytes ?? run.heap.readyBytes, peakRssBytes: run.peakRssBytes })
  }
  const result = { ...stamp(runtimeId, launch.version), kind: 'warm', task: taskId, runs }
  await writeJson(file, result)
  console.error(`warm baseline ${runtimeId}: ${((runs[0].footprintBytes ?? runs[0].rssBytes) / 2 ** 20).toFixed(1)} MB held`)
  warmBaselines.set(runtimeId, result)
  return result
}

// --- Adapters ---------------------------------------------------------------

async function prepareJs(ecosystem, name, meta, adapterDir) {
  const override = versionOverride && ecosystem === 'npm' ? { [name]: versionOverride } : {}
  const workdir = fromRoot('.cache/work', taskId, ecosystem, versionOverride ? `${name}@${versionOverride}` : name)
  await mkdir(workdir, { recursive: true })
  await writeFile(path.join(workdir, 'package.json'), JSON.stringify({private:true,type:'module',...(versionOverride?{overrides:{[name]:versionOverride}}:{})})+'\n')
  const packages = [...(ecosystem === 'npm' ? [name] : []), ...(meta.dependencies ?? [])]
  const jsrVersions = ecosystem === 'jsr' ? await installJsr(workdir, name) : {}
  const versions = { ...jsrVersions, ...await installPinned(workdir, packages, override) }
  await copyFile(path.join(adapterDir, 'adapter.js'), path.join(workdir, 'adapter.js'))
  await copyFile(isOperation ? fromRoot('harness/js/operation-runner.mjs') : RUNNER, path.join(workdir, 'runner.mjs'))
  if (isOperation) await copyFile(path.join(taskDir, 'scenario.mjs'), path.join(workdir, 'scenario.mjs'))
  return { workdir, version: versions[name] ?? null, dependencies: versions }
}

async function measure(target, launch, extra) {
  if (check) {
    const load = isStartup ? { launches: 1 } : { ...task.load, cycle: scenario.cases?.length, warmup: Math.min(task.load.warmup, 200), rounds: 1, minRoundMs: 20, ...(isOperation ? { operationsPerRound: Math.min(task.load.operationsPerRound, 500) } : { requestsPerRound: Math.min(task.load.requestsPerRound, 2000) }) }
    const run = await measurer({ ...launch, requests, load, verifyResults })
    if (run.status !== 'ok') failures++
    console.error(`${target.ecosystem}/${target.name} on ${launch.runtime}: ${run.status === 'ok' ? 'works' : `${run.status}: ${String(run.error).split('\n')[0]}`}`)
    return
  }
  const file = fromRoot('results', taskId, target.ecosystem, target.name, extra.version ?? '_', `${launch.runtime}.json`)
  if (await stands(file)) {
    if ((await readJson(file)).status !== 'ok') failures++
    return
  }
  const runs = []
  for (let i = 0; i < reps; i++) {
    const run = await measurer({ ...launch, requests, load: { ...task.load, cycle: scenario.cases?.length }, verifyResults })
    runs.push(run)
    if (run.status !== 'ok') break
  }
  const failed = runs.find((r) => r.status !== 'ok')
  if (failed) failures++
  const base = (isOperation && launch.warm ? await warmBaseline(launch.runtime, { ...launch.warm, version: launch.version }) : null) ?? await readJson(fromRoot('results/_baseline', `${launch.baselineId ?? launch.runtime}.json`))
  await writeJson(file, {
    task: taskId,
    ecosystem: target.ecosystem,
    package: target.name,
    ...extra,
    ...stamp(launch.runtime, launch.version),
    // What was run, so `npm run status` can tell when the adapter has changed since.
    source: adapterFingerprint(taskId, `${target.ecosystem}/${target.name}`),
    baseline: base,
    status: failed ? failed.status : 'ok',
    ...(failed ? { error: failed.error } : { runs }),
  })
  // The figures as the site will show them: medians of rounds, then of runs,
  // and memory as the physical footprint where the run and its baseline have it.
  const summary = failed ? `${failed.status}: ${failed.error.split('\n')[0]}` : (() => {
    const cpu = median(runs.map((run) => median(run.rounds.map((r) => (r.cpuMs * 1000) / (r.operations ?? r.requests)))))
    const footprint = runs.every((r) => r.footprintAfterLoadBytes != null) && base.runs.every((r) => r.footprintBytes != null)
    const held = median(runs.map((r) => (footprint ? r.footprintAfterLoadBytes : r.rssAfterLoadBytes)))
    const below = median(base.runs.map((r) => (footprint ? r.footprintBytes : r.rssBytes)))
    const mb = (bytes) => (bytes / 2 ** 20).toFixed(1)
    const spread = runs.length > 1 ? ` (runs ${runs.map((r) => mb(footprint ? r.footprintAfterLoadBytes : r.rssAfterLoadBytes)).join(', ')})` : ''
    return `${isStartup ? `${(cpu / 1000).toFixed(0)} ms CPU and ${median(runs.map((run) => median(run.rounds.map((r) => r.wallMs)))).toFixed(0)} ms to the first page` : `${cpu.toFixed(3)} µs CPU/${isOperation ? 'operation' : 'request'}`}, ${mb(Math.max(0, held - below))} MB memory (${mb(held)} MB held${spread}, ${mb(below)} MB ${base.kind === 'warm' ? 'warm' : 'idle'} baseline${footprint ? '' : ', resident size'})`
  })()
  console.error(`${target.ecosystem}/${target.name} on ${launch.runtime}: ${summary}`)
}

const jsLaunch = (runtimeId, cwd, adapter) => {
  const rt = config.runtimes[runtimeId]
  return {
    runtime: runtimeId,
    version: rt.version,
    command: rt.bin,
    args: [...rt.args, 'runner.mjs', adapter, ...(isOperation && adapter !== '-' ? ['scenario.mjs'] : [])],
    cwd,
    phases: ['boot', 'loaded', 'ready'],
  }
}

for (const runtimeId of jsIds.filter(selected)) {
  await baseline(runtimeId, { ...jsLaunch(runtimeId, fromRoot('harness/js'), '-') })
}
// The do-nothing JavaScript adapter and its launch, for the warm baseline.
async function jsWarm(runtimeId) {
  const dir = fromRoot('.cache/work', taskId, '_warm')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'package.json'), '{"private":true,"type":"module"}\n')
  await writeFile(path.join(dir, 'adapter.js'), 'export const operation = (input) => input\n')
  await copyFile(fromRoot('harness/js/operation-runner.mjs'), path.join(dir, 'runner.mjs'))
  await copyFile(path.join(taskDir, 'scenario.mjs'), path.join(dir, 'scenario.mjs'))
  return { ...jsLaunch(runtimeId, dir, 'adapter.js'), env: { BENCH_BASELINE: '1' } }
}

const adapters = globSync('{npm,jsr,builtin,cargo,pypi,rubygems,gomod}/**/adapter.json', { cwd: taskDir })
  .map((file) => {
    const [ecosystem, ...rest] = path.dirname(file).split(path.sep)
    return { ecosystem, name: rest.join('/'), dir: path.join(taskDir, path.dirname(file)) }
  })
  .filter((a) => !only || only.includes(a.name))
  .sort((a, b) => a.ecosystem.localeCompare(b.ecosystem) || a.name.localeCompare(b.name))

for (const target of adapters) {
  const sharedMeta = await readJson(path.join(target.dir, 'adapter.json'))
  const meta = {...sharedMeta,...sharedMeta.versions?.[versionOverride]}

  // An application shared by several tasks (adapter.json `app`): its own
  // prepare.mjs installs, builds and says how to start it. See
  // benchmarks/web-application-frameworks/README.md.
  if (meta.app) {
    for (const runtimeId of (meta.runtimes ?? jsIds).filter(selected)) {
      const rt = config.runtimes[runtimeId] ?? config.toolchains[runtimeId]
      let prepared
      try {
        prepared = await prepareApp(path.resolve(target.dir, meta.app), runtimeId, rt, meta.variant ?? null)
      } catch (error) {
        failures++
        console.error(`${target.ecosystem}/${target.name} on ${runtimeId}: could not prepare: ${String(error.stderr || error.message).trim().split('\n')[0]}`)
        continue
      }
      // A language whose runner measures the bare runtime itself gives its own
      // baseline; JavaScript runtimes use the shared one.
      const baselineId = prepared.base ? `${runtimeId}-http` : runtimeId
      await baseline(baselineId, prepared.base ? { ...prepared.base, version: rt.version } : jsLaunch(runtimeId, fromRoot('harness/js'), '-'))
      await measure(target, { phases: ['boot', 'loaded', 'ready'], ...prepared.launch, runtime: runtimeId, version: rt.version, baselineId }, { version: prepared.version ?? null, dependencies: prepared.dependencies ?? {}, ...(prepared.install ? { install: prepared.install } : {}) })
    }
    continue
  }

  if (meta.language && meta.language !== 'javascript' && !isOperation) {
    for (const runtimeId of meta.runtimes.filter(selected)) {
      const rt = config.runtimes[runtimeId] ?? config.toolchains[runtimeId]
      const prepared = await prepareNativeHttp(target,meta,rt)
      // A distinct empty HTTP driver baseline; embed it in each result.
      const baselineId = `${runtimeId}-http`
      await baseline(baselineId,prepared.base)
      await measure(target,{...prepared,runtime:runtimeId,version:rt.version,baselineId},prepared.extra)
    }
    continue
  }
  if (meta.language && meta.language !== 'javascript') {
    const fixtures = fromRoot('.cache/work', taskId, 'fixtures.json')
    await writeJson(fixtures, { cases: scenario.cases })
    for (const runtimeId of meta.runtimes.filter(selected)) {
      const rt = config.runtimes[runtimeId] ?? config.toolchains[runtimeId]
      let command = rt.bin, args, baseArgs, warm
      if (meta.language === 'go') {
        const work = fromRoot('.cache/work', taskId, 'builtin', target.name)
        await mkdir(work, { recursive: true })
        await copyFile(fromRoot('harness/go/runner.go'), path.join(work, 'runner.go'))
        await copyFile(path.join(target.dir, 'adapter.go'), path.join(work, 'adapter.go'))
        // The runner calls prepare on every fixture; most adapters have none.
        const prepares = /^func prepare\(/m.test(await readFile(path.join(target.dir, 'adapter.go'), 'utf8'))
        await writeFile(path.join(work, 'prepare.go'), prepares ? 'package main\n' : GO_NO_PREPARE)
        command = path.join(work, 'runner')
        execFileSync(rt.bin, ['build', '-o', command, 'runner.go', 'adapter.go', 'prepare.go'], { cwd: work, env: { ...process.env, GOCACHE: fromRoot('.cache/go-build'), GOTOOLCHAIN: 'local' }, stdio: 'inherit' })
        const baseWork = fromRoot('.cache/work/go-baseline')
        await mkdir(baseWork, { recursive: true })
        await copyFile(fromRoot('harness/go/runner.go'), path.join(baseWork, 'runner.go'))
        await writeFile(path.join(baseWork, 'adapter.go'), 'package main\nfunc operation(v any) any { return v }\n' + GO_NO_PREPARE.replace('package main\n', ''))
        const baseBin = path.join(baseWork, 'runner')
        execFileSync(rt.bin, ['build', '-o', baseBin, 'runner.go', 'adapter.go'], { cwd: baseWork, env: { ...process.env, GOCACHE: fromRoot('.cache/go-build'), GOTOOLCHAIN: 'local' }, stdio: 'inherit' })
        await baseline(runtimeId, { command: baseBin, args: ['-'], cwd: ROOT, version: rt.version })
        args = [fixtures]
        warm = { command: baseBin, args: [fixtures], cwd: ROOT, phases: ['boot', 'verification', 'ready'] }
      } else {
        const ext = meta.language === 'python' ? 'py' : 'rb'
        const runner = fromRoot('harness', meta.language, `runner.${ext}`)
        baseArgs = [...rt.args, runner, '-']
        await baseline(runtimeId, { command, args: baseArgs, cwd: ROOT, version: rt.version })
        args = [...rt.args, runner, path.join(target.dir, `adapter.${ext}`), fixtures]
        const idle = fromRoot('.cache/work', taskId, `_warm.${ext}`)
        await writeFile(idle, ext === 'py' ? 'def operation(value):\n    return value\n' : 'def operation(value) = value\n')
        warm = { command, args: [...rt.args, runner, idle, fixtures], cwd: ROOT, phases: ['boot', 'loaded', 'verification', 'ready'] }
      }
      await measure(target, { runtime: runtimeId, version: rt.version, command, args, cwd: ROOT, warm, phases: meta.language === 'go' ? ['boot','verification','ready'] : ['boot','loaded','verification','ready'] }, { version: null, dependencies: {} })
    }
    continue
  }

  if (target.ecosystem === 'cargo') {
    if (!selected('rust')) continue
    const rust = config.toolchains.rust
    const rustLaunch = (command) => ({ runtime: 'rust', version: rust.version, command, args: [], cwd: ROOT, phases: ['boot', 'ready'] })
    await baseline('rust', rustLaunch(cargoBuild('bench-harness', 'baseline')))
    const crate = /^name = "(.+)"/m.exec(await readFile(path.join(target.dir, 'Cargo.toml'), 'utf8'))[1]
    const launch = rustLaunch(cargoBuild(crate))
    if (isOperation) {
      const fixtures = fromRoot('.cache/work', taskId, 'fixtures.json')
      await writeJson(fixtures, { cases: scenario.cases })
      launch.args = [fixtures]
      launch.warm = { ...rustLaunch(cargoBuild('bench-harness', 'warm-baseline', 'operations')), args: [fixtures], phases: ['boot', 'verification', 'ready'] }
      if (scenario.verifyResults) launch.phases = ['boot', 'verification', 'ready']
    }
    await measure(target, launch, { version: await lockedCrateVersion(meta.package ?? target.name, crate), install: binaryInstall(launch.command, fromRoot('.cache/cargo-target/release/baseline')) })
    continue
  }

  if (!jsIds.some((id) => selected(id) && (!meta.runtimes || meta.runtimes.includes(id)))) continue
  let prepared
  try {
    // A variant (adapter.json `variantOf`) runs a sibling adapter's code for the
    // same package with the extra environment in its `env`.
    const sourceDir = meta.variantOf ? path.join(path.dirname(target.dir), meta.variantOf) : target.dir
    prepared = await prepareJs(target.ecosystem, meta.package ?? target.name, meta, sourceDir)
  } catch (error) {
    failures++
    console.error(`${target.ecosystem}/${target.name}: install failed: ${String(error.stderr || error.message).trim().split('\n')[0]}`)
    continue
  }
  // Support is detected by trying: an adapter that cannot start on a runtime
  // is recorded as failed there. adapter.json `runtimes` only narrows the set.
  for (const runtimeId of jsIds.filter(selected)) {
    if (meta.runtimes && !meta.runtimes.includes(runtimeId)) continue
    await measure(target, { ...jsLaunch(runtimeId, prepared.workdir, 'adapter.js'), env: meta.env, warm: isOperation ? await jsWarm(runtimeId) : null }, {
      version: prepared.version,
      dependencies: prepared.dependencies,
      install: nodeInstall(prepared.workdir),
      ...(meta.env ? { settings: meta.env } : {}),
    })
  }
}

// The other release lines listed for a package under `activeVersions` in
// versions.json (a pre-release, an older major) are measured with it: each
// by a run of this script for that one version, with the same flags.
if (!versionOverride) {
  const active = (await readJson(fromRoot('versions.json'))).activeVersions?.npm ?? {}
  const flags = argv.filter((a) => a.startsWith('--') && !a.startsWith('--only=') && !a.startsWith('--version='))
  for (const target of adapters.filter((a) => a.ecosystem === 'npm')) {
    for (const version of active[target.name] ?? []) {
      console.error(`\n${target.name} ${version}, also current:`)
      try {
        execFileSync(process.execPath, [fromRoot('scripts/measure.mjs'), taskId, ...flags, `--only=${target.name}`, `--version=${version}`], { stdio: 'inherit' })
      } catch {
        failures++
      }
    }
  }
}

if (failures) process.exitCode = 1
