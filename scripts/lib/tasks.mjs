// The benchmark tasks, found on disk: every benchmarks/<category>/<task>/
// folder that has a task.json. Adding a task's folder is all it takes for the
// scripts to pick it up.
import { globSync } from 'node:fs'
import path from 'node:path'
import { fromRoot, readJson } from './util.mjs'

export const taskIds = () => globSync('*/*/task.json', { cwd: fromRoot('benchmarks') }).map((file) => path.dirname(file)).sort()

// A task can run the adapters of another task instead of having folders of
// its own: task.json `adaptersFrom` names that task ("<category>/<task>").
// A lenient task does so with the adapters of its strict task (see "Strict
// and lenient tasks" in benchmarks/README.md). Results, working folders and
// fixtures stay the borrowing task's own; only the adapter folders are shared.
// This is the task whose folders hold the adapters of `taskId`.
export function adaptersTaskOf(taskId) {
  const from = JSON.parse(readFileSync(fromRoot('benchmarks', taskId, 'task.json'), 'utf8')).adaptersFrom
  if (!from) return taskId
  if (!existsSync(fromRoot('benchmarks', from, 'task.json'))) throw new Error(`${taskId}: adaptersFrom names "${from}", which is not a task`)
  if (JSON.parse(readFileSync(fromRoot('benchmarks', from, 'task.json'), 'utf8')).adaptersFrom) throw new Error(`${taskId}: adaptersFrom names "${from}", which has no adapters of its own`)
  return from
}

// The scenario files of a task: its own scenario.mjs and, for a task with
// `adaptersFrom`, the scenario of that task, which its own may import (as
// '../<task>/scenario.mjs') to derive its cases and its check from.
export function scenarioFiles(taskId) {
  const from = adaptersTaskOf(taskId)
  const own = fromRoot('benchmarks', taskId, 'scenario.mjs')
  return from === taskId ? [own] : [own, fromRoot('benchmarks', from, 'scenario.mjs')]
}

// Puts a task's scenario beside a JavaScript adapter as scenario.mjs. A
// scenario is loaded alone there, so the scenario a borrowing task imports is
// put beside it as scenario.from.mjs and the import is pointed at it.
export function placeScenario(taskId, dir) {
  const [own, borrowed] = scenarioFiles(taskId)
  let text = readFileSync(own, 'utf8')
  if (borrowed) {
    const specifier = `${path.posix.relative(taskId, adaptersTaskOf(taskId))}/scenario.mjs`
    text = text.replaceAll(`'${specifier}'`, "'./scenario.from.mjs'").replaceAll(`"${specifier}"`, '"./scenario.from.mjs"')
    writeFileSync(path.join(dir, 'scenario.from.mjs'), readFileSync(borrowed))
  }
  writeFileSync(path.join(dir, 'scenario.mjs'), text)
}

// The adapters of a task, as `<ecosystem>/<package>` (JSR packages have a
// scope, so the id can be three parts long), each with its adapter.json.
export async function adaptersOf(taskId) {
  const dir = fromRoot('benchmarks', adaptersTaskOf(taskId))
  const adapters = []
  for (const file of globSync('**/adapter.json', { cwd: dir, exclude: (name) => name === 'node_modules' || name === 'target' }).sort()) {
    adapters.push({ id: path.dirname(file), ...(await readJson(path.join(dir, file))) })
  }
  return adapters
}

// A fingerprint of what an adapter runs: its source files, and for a variant
// the source of the adapter it borrows plus its own settings. Stored with
// each result, so a later look can tell whether the code has changed since.
// Notes and other descriptive fields of adapter.json do not count.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
export function adapterFingerprint(taskId, adapterId) {
  const hash = createHash('sha256')
  const adaptersTask = adaptersTaskOf(taskId)
  const add = (id) => {
    const dir = fromRoot('benchmarks', adaptersTask, id)
    if (!existsSync(dir)) return null
    for (const file of globSync('**/*', { cwd: dir, withFileTypes: true, exclude: (entry) => ['node_modules', 'target', '.DS_Store', 'go.sum'].includes(entry.name) }).filter((entry) => entry.isFile()).map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name))).sort()) {
      if (file === 'adapter.json') continue
      hash.update(`${file}\0`).update(readFileSync(path.join(dir, file))).update('\0')
    }
    const settings = JSON.parse(readFileSync(path.join(dir, 'adapter.json'), 'utf8'))
    hash.update(JSON.stringify({ env: settings.env ?? null, variantOf: settings.variantOf ?? null, package: settings.package ?? null, ...(settings.variant ? { variant: settings.variant } : {}) }))
    // An application shared by several tasks is part of each of them.
    if (settings.app) {
      const app = path.resolve(dir, settings.app)
      for (const file of globSync('**/*', { cwd: app, withFileTypes: true, exclude: (entry) => ['node_modules', 'target', '.DS_Store', '.next', '.output', 'dist', 'tmp', 'log', '__pycache__', 'vendor'].includes(entry.name) }).filter((entry) => entry.isFile()).map((entry) => path.relative(app, path.join(entry.parentPath, entry.name))).sort()) {
        hash.update(`app/${file}\0`).update(readFileSync(path.join(app, file))).update('\0')
      }
    }
    return settings
  }
  const settings = add(adapterId)
  if (!settings) return null
  if (settings.variantOf) add(`${adapterId.slice(0, adapterId.lastIndexOf('/'))}/${settings.variantOf}`)
  return hash.digest('hex').slice(0, 16)
}

// Everything a task's figures depend on. Entries in a task are graded against
// each other, so when any of this changes the whole task is measured again,
// not just the part that changed:
//   harness   the measuring code (harness/, apart from its tests)
//   task      task.json's kind and load, and scenario.mjs
//   adapters  the source of every adapter in the task
//   runtimes  the version of every runtime and toolchain
//   machine   the computer the results came from
//   pins      the pinned version of every package the adapters use
// Stored with each result; `staleReason` compares a stored copy with now.
export async function taskInputs(taskId, { config, machine }) {
  const digest = (...parts) => parts.reduce((hash, part) => hash.update(part).update('\0'), createHash('sha256')).digest('hex').slice(0, 16)
  const harnessFiles = globSync('**/*', { cwd: fromRoot('harness'), withFileTypes: true, exclude: (entry) => ['tests', 'target', 'stubs', '.DS_Store'].includes(entry.name) })
    .filter((entry) => entry.isFile()).map((entry) => path.join(entry.parentPath, entry.name)).sort()
  const task = await readJson(fromRoot('benchmarks', taskId, 'task.json'))
  const adapters = await adaptersOf(taskId)
  const manifest = await readJson(fromRoot('versions.json'), {})
  const lock = existsSync(fromRoot('Cargo.lock')) ? readFileSync(fromRoot('Cargo.lock'), 'utf8') : ''
  const pins = {}
  for (const adapter of adapters) {
    const [ecosystem, ...rest] = adapter.id.split('/')
    for (const name of [adapter.package ?? rest.join('/'), ...(adapter.dependencies ?? [])]) {
      const version = ecosystem === 'cargo' ? new RegExp(`name = "${name}"\\nversion = "(.+)"`).exec(lock)?.[1] : manifest[ecosystem]?.[name]
      if (version) pins[`${ecosystem}/${name}`] = version
    }
  }
  return {
    harness: digest(...harnessFiles.flatMap((file) => [path.relative(fromRoot('harness'), file), readFileSync(file)])),
    // A task that borrows its adapters derives its scenario from the other task's, so that one counts too.
    task: digest(JSON.stringify({ kind: task.kind, load: task.load }), ...scenarioFiles(taskId).map((file) => readFileSync(file))),
    adapters: digest(...adapters.map((adapter) => `${adapter.id}=${adapterFingerprint(taskId, adapter.id)}`)),
    runtimes: Object.fromEntries([...Object.entries(config.runtimes), ...Object.entries(config.toolchains)].map(([id, entry]) => [id, entry.version ?? entry.expectedVersion ?? null])),
    machine: digest(JSON.stringify(machine)),
    pins,
  }
}

// Why a stored result no longer stands, in a few words, or null if it does.
// A package with no pin on one side is not a change: the pin is written the
// first time the package is installed.
export function staleReason(stored, current) {
  if (!stored) return 'measured before changes were tracked'
  if (stored.machine !== current.machine) return 'measured on a different machine'
  if (stored.harness !== current.harness) return 'the harness changed'
  if (stored.task !== current.task) return 'the task or its fixtures changed'
  if (stored.adapters !== current.adapters) return 'an adapter in the task changed'
  const runtime = Object.keys(current.runtimes).find((id) => id in (stored.runtimes ?? {}) && stored.runtimes[id] !== current.runtimes[id])
  if (runtime) return `${runtime} changed version (${stored.runtimes[runtime]} to ${current.runtimes[runtime]})`
  const pin = Object.keys(current.pins).find((name) => name in (stored.pins ?? {}) && stored.pins[name] !== current.pins[name])
  if (pin) return `${pin} changed version (${stored.pins[pin]} to ${current.pins[pin]})`
  return null
}

// Run one of the repository's scripts as a step of a longer run, showing its
// output as it goes. Returns whether it succeeded and how long it took.
import { spawnSync } from 'node:child_process'
export function runStep(title, command, args = [], options = {}) {
  console.error(`\n=== ${title} ===`)
  const started = Date.now()
  const result = spawnSync(command, args, { cwd: fromRoot(), stdio: 'inherit', ...options })
  return { title, ok: result.status === 0, seconds: Math.round((Date.now() - started) / 1000) }
}

export const duration = (seconds) => (seconds >= 3600 ? `${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min` : seconds >= 60 ? `${Math.floor(seconds / 60)} min ${seconds % 60} s` : `${seconds} s`)
