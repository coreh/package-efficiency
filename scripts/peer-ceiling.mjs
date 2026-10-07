// How fast the scripted HTTP peer of a client task answers when the client
// does next to nothing, beside what the task's stored results needed from it.
// A check on the method ("the peer must not be what a client waits for"), not
// a measurement: it records nothing.
// Usage: node scripts/peer-ceiling.mjs <category>/<task> [--requests=200000]
import { execFileSync } from 'node:child_process'
import { globSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { startPeer } from '../harness/client.mjs'
import { ROOT, fromRoot, median, readJson } from './lib/util.mjs'

const taskId = process.argv[2]
const total = Number(process.argv.find((a) => a.startsWith('--requests='))?.split('=')[1] ?? 200_000)
const task = await readJson(fromRoot('benchmarks', taskId, 'task.json'))
const scenario = await import(pathToFileURL(fromRoot('benchmarks', taskId, 'scenario.mjs')).href)
if (scenario.peer?.program !== 'http') throw new Error('only the http peer has a ceiling check')
const route = scenario.peer.script.routes.find((r) => r.method === 'GET')
if (!route) throw new Error('the ceiling check sends GET requests; the task has no GET route')

for (const bin of ['http-peer', 'http-peer-ceiling']) {
  execFileSync('cargo', ['build', '--locked', '--release', '--quiet', '-p', 'bench-harness', '--bin', bin, '--features', 'peers'], { cwd: ROOT, stdio: 'inherit' })
}
const dir = await mkdtemp(path.join(tmpdir(), 'peer-ceiling-'))
const peer = await startPeer({ command: fromRoot('.cache/cargo-target/release/http-peer'), script: scenario.peer.script, dir })
try {
  const lanes = task.load.concurrency
  const run = () => {
    const before = execFileSync(fromRoot('.cache/cargo-target/release/http-peer-ceiling'), [String(peer.port), String(lanes), String(Math.ceil(total / lanes)), route.path], { encoding: 'utf8' })
    return JSON.parse(before)
  }
  run()
  let cpu = (await peer.stats()).cpuMs
  const runs = []
  for (let i = 0; i < 3; i++) {
    const result = run()
    const stats = await peer.stats()
    if (stats.refused) throw new Error(stats.firstRefusal)
    runs.push({ rps: (result.requests * 1000) / result.wallMs, clientUs: (result.cpuMs * 1000) / result.requests, peerUs: ((stats.cpuMs - cpu) * 1000) / result.requests })
    cpu = stats.cpuMs
  }
  const ceiling = median(runs.map((r) => r.rps))
  console.log(`${taskId}: ${lanes} connections, ${route.method} ${route.path}`)
  console.log(`peer ceiling: ${Math.round(ceiling).toLocaleString('en-US')} requests/s (bare client ${median(runs.map((r) => r.clientUs)).toFixed(1)} µs CPU/request, peer ${median(runs.map((r) => r.peerUs)).toFixed(1)} µs CPU/request)`)

  // What the stored results asked of the peer.
  const rows = []
  for (const file of globSync('**/*.json', { cwd: fromRoot('results', taskId) })) {
    const result = await readJson(fromRoot('results', taskId, file))
    if (result.status !== 'ok') continue
    const rounds = result.runs.flatMap((r) => r.rounds)
    rows.push({
      entry: `${result.ecosystem}/${result.package} on ${result.runtime}`,
      rps: median(rounds.map((r) => (r.requests * 1000) / r.wallMs)),
      peerUs: median(rounds.map((r) => (r.peerCpuMs * 1000) / r.requests)),
      // The share of the round's wall time, summed over its lanes, that the peer was busy.
      busy: median(rounds.map((r) => r.peerCpuMs / (r.wallMs * lanes))),
    })
  }
  rows.sort((a, b) => b.rps - a.rps)
  for (const row of rows) console.log(`${row.entry.padEnd(44)} ${Math.round(row.rps).toLocaleString('en-US').padStart(9)} requests/s = ${((100 * row.rps) / ceiling).toFixed(0).padStart(3)} % of the ceiling; peer ${row.peerUs.toFixed(1)} µs CPU/request, busy ${(100 * row.busy).toFixed(0)} % of its lanes' time`)
} finally {
  await peer.stop()
  await rm(dir, { recursive: true, force: true })
}
