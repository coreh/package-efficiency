// Try one setting at several values for one native HTTP adapter and print CPU
// per request for each, to choose its "tuned" variant. Nothing is written to
// results/. The task rules fix which settings and values may be tried.
// Usage: node scripts/sweep-setting.mjs <category>/<task> <ecosystem>/<adapter> --runtime=<id> --env=<NAME> --values=1,4,16,64
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { measureServer } from '../harness/supervisor.mjs'
import { prepareNativeHttp } from './lib/native-http.mjs'
import { fromRoot, loadConfig, median, readJson } from './lib/util.mjs'

const [taskId, adapterId] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const flag = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const runtimeId = flag('runtime')
const name = flag('env')
const values = flag('values')?.split(',')
if (!taskId || !adapterId || !runtimeId || !name || !values) {
  console.error('Usage: node scripts/sweep-setting.mjs <category>/<task> <ecosystem>/<adapter> --runtime=<id> --env=<NAME> --values=1,4,16,64')
  process.exit(1)
}

const taskDir = fromRoot('benchmarks', taskId)
const task = await readJson(path.join(taskDir, 'task.json'))
const { requests } = await import(pathToFileURL(path.join(taskDir, 'scenario.mjs')).href)
const config = await loadConfig()
const [ecosystem, ...rest] = adapterId.split('/')
const target = { ecosystem, name: rest.join('/'), dir: path.join(taskDir, adapterId) }
const meta = await readJson(path.join(target.dir, 'adapter.json'))
const rt = config.runtimes[runtimeId] ?? config.toolchains[runtimeId]

const rows = []
for (const value of values) {
  const prepared = await prepareNativeHttp(target, { ...meta, env: { ...meta.env, [name]: value } }, rt)
  const run = await measureServer({ ...prepared, requests, load: task.load })
  if (run.status !== 'ok') {
    console.log(`${name}=${value}: ${run.status}: ${run.error.split('\n')[0]}`)
    continue
  }
  const cpuUs = median(run.rounds.map((r) => (r.cpuMs * 1000) / r.requests))
  rows.push({ value, cpuUs })
  console.log(`${name}=${value}: ${cpuUs.toFixed(1)} µs CPU per request, ${Math.round(median(run.rounds.map((r) => (r.requests * 1000) / r.wallMs)))} requests/s`)
}
if (rows.length) console.log(`best: ${name}=${rows.reduce((a, b) => (a.cpuUs <= b.cpuUs ? a : b)).value}`)
