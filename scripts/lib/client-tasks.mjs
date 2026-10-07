// What scripts/measure.mjs needs for a task of kind "client": the runner of
// each language, the peer the task names, and how a standard-library client
// of Python, Ruby or Go is started. The measuring itself is in
// harness/client.mjs; the rules are in benchmarks/README.md, "Client tasks".
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { measureClient } from '../../harness/client.mjs'
import { ROOT, fromRoot } from './util.mjs'

export const CLIENT_KIND = 'client'
export const CLIENT_JS_RUNNER = fromRoot('harness/js/client-runner.mjs')

// The peers that exist: scenario.mjs names one as `peer.program`, and it is
// the binary `<program>-peer` of harness/rust (feature `peers`).
const peerSource = (program) => fromRoot('harness/rust/src/bin', `${program}-peer.rs`)

// task.json `load` and the scenario's `peer` and `cases` are the task: how
// many exchanges are in flight, over how many connections, and what the peer
// is scripted to accept and answer.
export function checkClientTask(task, scenario) {
  const { concurrency, connections = 2 * concurrency, warmup, rounds, requestsPerRound } = task.load ?? {}
  const positive = (n) => Number.isInteger(n) && n > 0
  if (!positive(concurrency)) throw new Error('a client task needs load.concurrency (exchanges in flight, a positive integer) in task.json')
  if (!positive(connections)) throw new Error('load.connections must be a positive integer')
  if (!positive(warmup) || !positive(rounds) || !positive(requestsPerRound)) throw new Error('a client task needs load.warmup, load.rounds and load.requestsPerRound in task.json')
  const { peer, cases } = scenario
  if (!peer?.program || !peer.script) throw new Error('scenario.mjs of a client task exports `peer = { program, script }`')
  if (!/^[a-z0-9]+$/.test(peer.program) || !existsSync(peerSource(peer.program))) throw new Error(`there is no peer "${peer.program}" (harness/rust/src/bin/${peer.program}-peer.rs)`)
  if (!Array.isArray(cases) || cases.length === 0) throw new Error('scenario.mjs of a client task exports `cases`')
  // Every round sends each fixture the same number of times, in every lane
  // layout, only if the counts are whole passes over the fixtures.
  for (const [name, count] of [['warmup', warmup], ['requestsPerRound', requestsPerRound]]) {
    if (count % cases.length !== 0) throw new Error(`load.${name} (${count}) must be a multiple of the number of fixtures (${cases.length})`)
  }
}

// The measurer for scripts/measure.mjs. `build` is its cargoBuild; the peer
// is built the first time an adapter is about to run.
export function clientMeasurer({ scenario, build }) {
  let command = null
  return (options) => {
    command ??= build('bench-harness', `${scenario.peer.program}-peer`, 'peers')
    return measureClient({ ...options, cases: scenario.cases, peer: { command, script: scenario.peer.script } })
  }
}

// A standard-library client of Python, Ruby or Go: how to start it, and the
// idle process of the same runtime that its memory is counted above (the same
// baseline as the language's synchronous tasks).
export async function prepareNativeClient({ taskId, target, meta, rt, goBaseline }) {
  if (target.ecosystem !== 'builtin') throw new Error(`${target.ecosystem}/${target.name}: client tasks run standard-library clients of ${meta.language} only, for now (see "Client tasks" in benchmarks/README.md)`)
  if (meta.language === 'go') {
    const work = fromRoot('.cache/work', taskId, 'builtin', target.name)
    await mkdir(work, { recursive: true })
    await copyFile(fromRoot('harness/go/client-runner.go'), path.join(work, 'runner.go'))
    await copyFile(path.join(target.dir, 'adapter.go'), path.join(work, 'adapter.go'))
    const command = path.join(work, 'runner')
    execFileSync(rt.bin, ['build', '-o', command, 'runner.go', 'adapter.go'], { cwd: work, env: { ...process.env, GOCACHE: fromRoot('.cache/go-build'), GOTOOLCHAIN: 'local' }, stdio: 'inherit' })
    return {
      launch: { command, args: [], cwd: ROOT, env: meta.env, phases: ['boot', 'ready'] },
      base: { command: await goBaseline(rt), args: ['-'], cwd: ROOT },
    }
  }
  const ext = meta.language === 'python' ? 'py' : 'rb'
  return {
    launch: { command: rt.bin, args: [...rt.args, fromRoot('harness', meta.language, `client-runner.${ext}`), path.join(target.dir, `adapter.${ext}`)], cwd: ROOT, env: meta.env, phases: ['boot', 'loaded', 'ready'] },
    base: { command: rt.bin, args: [...rt.args, fromRoot('harness', meta.language, `runner.${ext}`), '-'], cwd: ROOT },
  }
}
