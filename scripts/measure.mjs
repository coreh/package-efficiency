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
import { existsSync, globSync, statSync } from 'node:fs'
import { copyFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { HARNESS_VERSION, measureBaseline, measureServer, measureOperation, measureStartup } from '../harness/supervisor.mjs'
import { announceFiles, fixtureFiles } from '../harness/files.mjs'
import { installPinned, installJsr } from './lib/npm.mjs'
import { binaryInstall, nodeInstall } from './lib/install-size.mjs'
import { prepareApp } from './lib/apps.mjs'
import { NATIVE_REGISTRIES, lockNativePackage, nativeMeta, prepareNativePackage } from './lib/native-packages.mjs'
import { adapterFingerprint, staleReason, taskInputs } from './lib/tasks.mjs'
import { ASYNC_JS_RUNNER, ASYNC_KIND, asyncEnv, asyncNativeRunner, checkAsyncTask, concurrencyRecord, measureAsyncOperation } from './lib/async-operation.mjs'
import { CLIENT_JS_RUNNER, CLIENT_KIND, checkClientTask, clientMeasurer, prepareNativeClient } from './lib/client-tasks.mjs'
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
// (No result is recorded. The first run of a PyPI, RubyGems or Go module
// adapter, with or without --check, does write its lock beside it and its
// pin in versions.json: see scripts/lib/native-packages.mjs.)
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
// Fixture files of a task on the file system (harness/files.mjs): the scratch
// directory is named before the scenario is read, which builds its inputs from it.
announceFiles(taskId)
const scenario = await import(pathToFileURL(path.join(taskDir, 'scenario.mjs')).href)
const fileFixtures = fixtureFiles(taskId, scenario)
const { requests } = scenario
// An asynchronous operation (one awaited call each) is measured as an
// operation, with its own runners; see scripts/lib/async-operation.mjs.
const isAsync = task.kind === ASYNC_KIND
if (isAsync) checkAsyncTask(task)
const isOperation = task.kind === 'sync-operation' || isAsync
const config = await loadConfig()
// A client task (the adapter is a client library, the harness provides its
// peer) has its own runners and driver; see scripts/lib/client-tasks.mjs.
const isClient = task.kind === CLIENT_KIND
if (isClient) checkClientTask(task, scenario)
const RUNNER = isClient ? CLIENT_JS_RUNNER : fromRoot('harness/js/runner.mjs')
const GO_NO_PREPARE = 'package main\nfunc prepare(v any) any { return v }\n'

// A startup task launches the server anew for each sample; see measureStartup.
const isStartup = task.kind === 'server-startup'
const measurer = isClient ? clientMeasurer({ scenario, build: (...build) => cargoBuild(...build) }) : isAsync ? measureAsyncOperation : isOperation ? measureOperation : isStartup ? measureStartup : measureServer
if (!isOperation && !isStartup && !isClient && task.kind !== 'http-server') throw new Error(`no driver for task kind "${task.kind}" yet`)

// What this task's figures depend on. A stored result stands only while all
// of it is unchanged; otherwise the whole task is measured again, since its
// entries are graded against each other.
let inputs = await taskInputs(taskId, { config, machine: machine() })
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
// A finer CPU clock for the supervisor on macOS (see cpuSeconds there): a
// small helper, built once and again when its source changes. Without cargo
// the supervisor reads `ps`, to a hundredth of a second.
if (process.platform === 'darwin' && !process.env.BENCH_CPUTIME) {
  const helper = fromRoot('.cache/cargo-target/release/cputime'), source = fromRoot('harness/rust/src/bin/cputime.rs')
  try {
    if (!existsSync(helper) || statSync(helper).mtimeMs < statSync(source).mtimeMs) {
      execFileSync('cargo', ['build', '--locked', '--release', '--quiet', '-p', 'bench-harness', '--bin', 'cputime'], { cwd: ROOT, stdio: 'inherit' })
    }
    if (Number.isFinite(Number(execFileSync(helper, [String(process.pid)], { encoding: 'utf8' })))) process.env.BENCH_CPUTIME = helper
  } catch {
    console.error('cpu clock: the cputime helper could not be built or run; CPU time is read to a hundredth of a second.')
  }
}

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
    const run = await measureOperation({ ...launch, ...(fileFixtures.declared ? { env: { ...launch.env, BENCH_FILES_RESET: '' } } : {}), load: { ...task.load, cycle: scenario.cases?.length }, verifyResults: () => {} })
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
  await copyFile(isAsync ? ASYNC_JS_RUNNER : isOperation ? fromRoot('harness/js/operation-runner.mjs') : RUNNER, path.join(workdir, 'runner.mjs'))
  if (isOperation) await copyFile(path.join(taskDir, 'scenario.mjs'), path.join(workdir, 'scenario.mjs'))
  return { workdir, version: versions[name] ?? null, dependencies: versions }
}

async function measure(target, launch, extra) {
  // The thread count of an asynchronous task, for the adapter and its warm baseline alike.
  if (isAsync) launch = { ...launch, env: { ...asyncEnv(task), ...launch.env }, warm: launch.warm && { ...launch.warm, env: { ...asyncEnv(task), ...launch.warm.env } } }
  if (check) {
    const load = isStartup ? { launches: 1 } : { ...task.load, cycle: scenario.cases?.length, warmup: Math.min(task.load.warmup, 200), rounds: 1, minRoundMs: 20, ...(isOperation ? { operationsPerRound: Math.min(task.load.operationsPerRound, 500) } : { requestsPerRound: Math.min(task.load.requestsPerRound, 2000) }) }
    const run = await fileFixtures.around(() => measurer({ ...launch, requests, load, verifyResults }))
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
    const run = await fileFixtures.around(() => measurer({ ...launch, requests, load: { ...task.load, cycle: scenario.cases?.length }, verifyResults }))
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
    ...(isAsync ? { concurrency: concurrencyRecord(task, target.dir) } : {}),
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
  await copyFile(isAsync ? ASYNC_JS_RUNNER : fromRoot('harness/js/operation-runner.mjs'), path.join(dir, 'runner.mjs'))
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

// A PyPI, RubyGems or Go module adapter of a synchronous task is resolved to
// exact files the first time it is seen, and the lock is written beside it
// (scripts/lib/native-packages.mjs). That is done here for every such adapter
// of the task, selected or not, before anything is measured: a lock is part
// of its adapter's fingerprint, which each result records.
// Synchronous tasks only: the other kinds of task have runners of their own.
const takesPackages = task.kind === 'sync-operation'
const packaged = (target) => takesPackages && target.ecosystem in NATIVE_REGISTRIES
const unlocked = new Map()
if (takesPackages) {
  let wrote = false
  for (const file of globSync('{pypi,rubygems,gomod}/*/adapter.json', { cwd: taskDir }).sort()) {
    const [ecosystem, name] = path.dirname(file).split(path.sep)
    const target = { ecosystem, name, dir: path.join(taskDir, ecosystem, name) }
    try {
      if (await lockNativePackage({ target, meta: await readJson(path.join(taskDir, file)), config })) {
        wrote = true
        console.error(`${ecosystem}/${name}: resolved and locked`)
      }
    } catch (error) {
      unlocked.set(`${ecosystem}/${name}`, String(error.message).trim().split('\n')[0])
    }
  }
  if (wrote) inputs = await taskInputs(taskId, { config, machine: machine() })
}

// A package that cannot run on a runtime (no wheel that PyPy can use) is
// recorded as not available there. It is not a failure of the task.
async function notAvailable(target, runtimeId, rt, { version, unavailable }) {
  console.error(`${target.ecosystem}/${target.name} on ${runtimeId}: not available: ${unavailable}`)
  if (check) return
  await writeJson(fromRoot('results', taskId, target.ecosystem, target.name, version ?? '_', `${runtimeId}.json`), {
    task: taskId, ecosystem: target.ecosystem, package: target.name, version: version ?? null, dependencies: {},
    ...stamp(runtimeId, rt.version),
    source: adapterFingerprint(taskId, `${target.ecosystem}/${target.name}`),
    status: 'unsupported',
    error: unavailable,
  })
}

// The Go runner with a do-nothing adapter: the baseline of the Go adapters and
// what their binaries are sized against. Built in a folder of this run's own
// and renamed into place, so a run beside this one never starts a half-written
// program.
async function goBaseline(rt) {
  const shared = fromRoot('.cache/work/go-baseline')
  const own = path.join(shared, String(process.pid))
  await mkdir(own, { recursive: true })
  await copyFile(fromRoot('harness/go/runner.go'), path.join(own, 'runner.go'))
  await writeFile(path.join(own, 'adapter.go'), 'package main\nfunc operation(v any) any { return v }\n' + GO_NO_PREPARE.replace('package main\n', ''))
  execFileSync(rt.bin, ['build', '-o', 'runner', 'runner.go', 'adapter.go'], { cwd: own, env: { ...process.env, GOCACHE: fromRoot('.cache/go-build'), GOTOOLCHAIN: 'local' }, stdio: 'inherit' })
  await rename(path.join(own, 'runner'), path.join(shared, 'runner'))
  await rm(own, { recursive: true, force: true })
  return path.join(shared, 'runner')
}

for (const target of adapters) {
  const sharedMeta = await readJson(path.join(target.dir, 'adapter.json'))
  const meta = packaged(target) ? nativeMeta(target, {...sharedMeta,...sharedMeta.versions?.[versionOverride]}) : {...sharedMeta,...sharedMeta.versions?.[versionOverride]}

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

  // A client task: the standard-library client of Python, Ruby or Go, above
  // the same idle baseline as the language's synchronous tasks.
  if (isClient && meta.language && meta.language !== 'javascript') {
    for (const runtimeId of meta.runtimes.filter(selected)) {
      const rt = config.runtimes[runtimeId] ?? config.toolchains[runtimeId]
      const prepared = await prepareNativeClient({ taskId, target, meta, rt, goBaseline })
      await baseline(runtimeId, { ...prepared.base, version: rt.version })
      await measure(target, { ...prepared.launch, runtime: runtimeId, version: rt.version }, { version: null, dependencies: {} })
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
      // A package from PyPI, RubyGems or the Go module proxy: installed (or
      // built) from its lock, then run by the same runner, against the same
      // baseline, as a standard-library adapter of its language.
      let prepared = null
      if (packaged(target)) {
        const id = `${target.ecosystem}/${target.name}`
        try {
          if (unlocked.has(id)) throw new Error(unlocked.get(id))
          prepared = await prepareNativePackage({ taskId, target, meta, runtimeId, rt, config })
        } catch (error) {
          failures++
          console.error(`${id} on ${runtimeId}: could not install: ${String(error.message).trim().split('\n')[0]}`)
          continue
        }
        if (prepared.unavailable) {
          await notAvailable(target, runtimeId, rt, prepared)
          continue
        }
      }
      if (meta.language === 'go') {
        if (prepared) command = prepared.command
        else {
          const work = fromRoot('.cache/work', taskId, 'builtin', target.name)
          await mkdir(work, { recursive: true })
          await copyFile(fromRoot('harness/go/runner.go'), path.join(work, 'runner.go'))
          await copyFile(path.join(target.dir, 'adapter.go'), path.join(work, 'adapter.go'))
          // The runner calls prepare on every fixture; most adapters have none.
          const prepares = /^func prepare\(/m.test(await readFile(path.join(target.dir, 'adapter.go'), 'utf8'))
          await writeFile(path.join(work, 'prepare.go'), prepares ? 'package main\n' : GO_NO_PREPARE)
          command = path.join(work, 'runner')
          execFileSync(rt.bin, ['build', '-o', command, 'runner.go', 'adapter.go', 'prepare.go'], { cwd: work, env: { ...process.env, GOCACHE: fromRoot('.cache/go-build'), GOTOOLCHAIN: 'local' }, stdio: 'inherit' })
        }
        const baseBin = await goBaseline(rt)
        // What the module adds to the program, as for a crate.
        if (prepared) prepared.install = binaryInstall(command, baseBin)
        await baseline(runtimeId, { command: baseBin, args: ['-'], cwd: ROOT, version: rt.version })
        args = [fixtures]
        warm = { command: baseBin, args: [fixtures], cwd: ROOT, phases: ['boot', 'verification', 'ready'] }
      } else {
        const ext = meta.language === 'python' ? 'py' : 'rb'
        const runner = fromRoot('harness', meta.language, `runner.${ext}`)
        baseArgs = [...rt.args, runner, '-']
        await baseline(runtimeId, { command, args: baseArgs, cwd: ROOT, version: rt.version })
        const taskRunner = isAsync ? asyncNativeRunner(meta.language, ext) : runner
        args = [...rt.args, taskRunner, path.join(target.dir, `adapter.${ext}`), fixtures]
        const idle = fromRoot('.cache/work', taskId, `_warm.${ext}`)
        await writeFile(idle, ext === 'py' ? 'def operation(value):\n    return value\n' : 'def operation(value) = value\n')
        warm = { command, args: [...rt.args, taskRunner, idle, fixtures], cwd: ROOT, phases: ['boot', 'loaded', 'verification', 'ready'] }
      }
      await measure(target, { runtime: runtimeId, version: rt.version, command, args, cwd: ROOT, warm, ...(prepared ? { env: { ...prepared.env, ...meta.env } } : {}), phases: meta.language === 'go' ? ['boot','verification','ready'] : ['boot','loaded','verification','ready'] }, prepared ? { version: prepared.version, dependencies: prepared.dependencies, ...(prepared.install ? { install: prepared.install } : {}), ...(meta.env ? { settings: meta.env } : {}) } : { version: null, dependencies: {} })
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
