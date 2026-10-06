// Measure every adapter of one task on every runtime it supports, writing one
// raw result file per (adapter, runtime) under results/.
// Usage: node scripts/measure.mjs <category>/<task> [--only=a,b] [--runtimes=node,bun] [--reps=3] [--force]
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
import { HARNESS_VERSION, measureBaseline, measureServer, measureOperation } from '../harness/supervisor.mjs'
import { installPinned, installJsr } from './lib/npm.mjs'
import { ROOT, fromRoot, loadConfig, machine, readJson, writeJson } from './lib/util.mjs'

const argv = process.argv.slice(2)
const taskId = argv.find((a) => !a.startsWith('--'))
const flag = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const only = flag('only')?.split(',')
const onlyRuntimes = flag('runtimes')?.split(',')
const reps = Number(flag('reps') ?? 3)
const force = argv.includes('--force')
let failures = 0
const versionOverride = flag('version')
if (versionOverride && only?.length !== 1) {
  console.error('--version needs --only=<one package>')
  process.exit(1)
}
if (!Number.isInteger(reps) || reps < 1) throw new Error("--reps must be a positive integer")
if (!taskId) {
  console.error('Usage: node scripts/measure.mjs <category>/<task> [--only=a,b] [--runtimes=node,bun] [--reps=3] [--force]')
  process.exit(1)
}

const taskDir = fromRoot('benchmarks', taskId)
const task = await readJson(path.join(taskDir, 'task.json'))
const scenario = await import(pathToFileURL(path.join(taskDir, 'scenario.mjs')).href)
const { requests } = scenario
const isOperation = task.kind === 'sync-operation'
const config = await loadConfig()
const RUNNER = fromRoot('harness/js/runner.mjs')

if (!isOperation && task.kind !== 'http-server') throw new Error(`no driver for task kind "${task.kind}" yet`)

const stamp = (runtime, runtimeVersion) => ({
  runtime,
  runtimeVersion,
  machine: machine(),
  harness: HARNESS_VERSION,
  measuredAt: new Date().toISOString(),
})

const jsIds = Object.keys(config.runtimes).filter(id => (config.runtimes[id].language ?? 'javascript') === 'javascript')
const verifyResults = scenario.verifyResults ?? (outputs => assert.deepEqual(outputs, scenario.cases.map(c => c.expected)))
const selected = (runtimeId) => !onlyRuntimes || onlyRuntimes.includes(runtimeId)

// --- Rust -------------------------------------------------------------------

let cargoChecked = false
function cargoBuild(crate, bin) {
  if (!cargoChecked) {
    execFileSync(process.execPath, ['scripts/check-cargo-age.mjs'], { cwd: ROOT, stdio: 'inherit' })
    cargoChecked = true
  }
  // One crate per invocation: building the workspace at once would merge
  // feature flags across adapters and change the binaries being measured.
  console.error(`building ${bin ?? crate}`)
  execFileSync('cargo', ['build', '--locked', '--release', '--quiet', '-p', crate, ...(bin ? ['--bin', bin] : [])], {
    cwd: ROOT,
    stdio: 'inherit',
  })
  return fromRoot('.cache/cargo-target/release', bin ?? crate)
}

async function lockedCrateVersion(name) {
  const lock = await readFile(fromRoot('Cargo.lock'), 'utf8')
  return new RegExp(`name = "${name}"\\nversion = "(.+)"`).exec(lock)?.[1] ?? null
}

// --- Baselines --------------------------------------------------------------

async function baseline(runtimeId, launch) {
  const file = fromRoot('results/_baseline', `${runtimeId}.json`)
  if (!force && existsSync(file) && (await readJson(file)).harness === HARNESS_VERSION) return
  const runs = []
  for (let i = 0; i < reps; i++) runs.push(await measureBaseline(launch))
  await writeJson(file, { ...stamp(runtimeId, launch.version), runs })
  console.error(`baseline ${runtimeId}: ${(runs[0].peakRssBytes / 2 ** 20).toFixed(1)} MB peak`)
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
  const file = fromRoot('results', taskId, target.ecosystem, target.name, extra.version ?? '_', `${launch.runtime}.json`)
  if (!force && existsSync(file) && (await readJson(file)).harness === HARNESS_VERSION) {
    if ((await readJson(file)).status !== 'ok') failures++
    return
  }
  const runs = []
  for (let i = 0; i < reps; i++) {
    const run = await (isOperation ? measureOperation : measureServer)({ ...launch, requests, load: task.load, verifyResults })
    runs.push(run)
    if (run.status !== 'ok') break
  }
  const failed = runs.find((r) => r.status !== 'ok')
  if (failed) failures++
  await writeJson(file, {
    task: taskId,
    ecosystem: target.ecosystem,
    package: target.name,
    ...extra,
    ...stamp(launch.runtime, launch.version),
    baseline: await readJson(fromRoot('results/_baseline', `${launch.baselineId ?? launch.runtime}.json`)),
    status: failed ? failed.status : 'ok',
    ...(failed ? { error: failed.error } : { runs }),
  })
  const summary = failed
    ? `${failed.status}: ${failed.error.split('\n')[0]}`
    : `${((runs[0].rounds[0].cpuMs * 1000) / (runs[0].rounds[0].operations ?? runs[0].rounds[0].requests)).toFixed(3)} µs CPU/${isOperation ? "operation" : "request"}`
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
      let command = rt.bin, args, baseArgs
      if (meta.language === 'go') {
        const work = fromRoot('.cache/work', taskId, 'builtin', target.name)
        await mkdir(work, { recursive: true })
        await copyFile(fromRoot('harness/go/runner.go'), path.join(work, 'runner.go'))
        await copyFile(path.join(target.dir, 'adapter.go'), path.join(work, 'adapter.go'))
        command = path.join(work, 'runner')
        execFileSync(rt.bin, ['build', '-o', command, 'runner.go', 'adapter.go'], { cwd: work, env: { ...process.env, GOCACHE: fromRoot('.cache/go-build'), GOTOOLCHAIN: 'local' }, stdio: 'inherit' })
        const baseWork = fromRoot('.cache/work/go-baseline')
        await mkdir(baseWork, { recursive: true })
        await copyFile(fromRoot('harness/go/runner.go'), path.join(baseWork, 'runner.go'))
        await writeFile(path.join(baseWork, 'adapter.go'), 'package main\nfunc operation(v any) any { return v }\n')
        const baseBin = path.join(baseWork, 'runner')
        execFileSync(rt.bin, ['build', '-o', baseBin, 'runner.go', 'adapter.go'], { cwd: baseWork, env: { ...process.env, GOCACHE: fromRoot('.cache/go-build'), GOTOOLCHAIN: 'local' }, stdio: 'inherit' })
        await baseline(runtimeId, { command: baseBin, args: ['-'], cwd: ROOT, version: rt.version })
        args = [fixtures]
      } else {
        const ext = meta.language === 'python' ? 'py' : 'rb'
        const runner = fromRoot('harness', meta.language, `runner.${ext}`)
        baseArgs = [...rt.args, runner, '-']
        await baseline(runtimeId, { command, args: baseArgs, cwd: ROOT, version: rt.version })
        args = [...rt.args, runner, path.join(target.dir, `adapter.${ext}`), fixtures]
      }
      await measure(target, { runtime: runtimeId, version: rt.version, command, args, cwd: ROOT, phases: meta.language === 'go' ? ['boot','verification','ready'] : ['boot','loaded','verification','ready'] }, { version: null, dependencies: {} })
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
      if (scenario.verifyResults) launch.phases = ['boot', 'verification', 'ready']
    }
    await measure(target, launch, { version: await lockedCrateVersion(meta.package ?? target.name) })
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
    await measure(target, { ...jsLaunch(runtimeId, prepared.workdir, 'adapter.js'), env: meta.env }, {
      version: prepared.version,
      dependencies: prepared.dependencies,
      ...(meta.env ? { settings: meta.env } : {}),
    })
  }
}

if (failures) process.exitCode = 1
