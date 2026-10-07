// What has been measured and what has not, without measuring anything: for
// each task, how many adapter and runtime results there are, which failed,
// which are from an older harness and which adapters have no result at all.
// Then which measured npm and JSR packages lack a type check.
// Usage: node scripts/status.mjs [--all]     (--all lists every result, not only the problems)
import { globSync } from 'node:fs'
import { HARNESS_VERSION } from '../harness/supervisor.mjs'
import { adapterFingerprint, adaptersOf, taskIds } from './lib/tasks.mjs'
import { fromRoot, readJson } from './lib/util.mjs'

const all = process.argv.includes('--all')
const age = (iso) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
}

let problems = 0
for (const taskId of taskIds()) {
  const adapters = await adaptersOf(taskId)
  const files = globSync('**/*.json', { cwd: fromRoot('results', taskId) })
  const results = []
  for (const file of files) results.push({ file, ...(await readJson(fromRoot('results', taskId, file))) })
  // results/<task>/<ecosystem>/<name…>/<version or _>/<runtime>.json
  const adapterOf = (file) => file.split('/').slice(0, -2).join('/')
  const measured = new Set(results.map((r) => adapterOf(r.file)))
  const ok = results.filter((r) => r.status === 'ok')
  // 'unsupported' is a package that cannot run on a runtime (no wheel for PyPy): recorded, not a failure.
  const failed = results.filter((r) => r.status && r.status !== 'ok' && r.status !== 'unsupported')
  const old = results.filter((r) => r.harness !== HARNESS_VERSION)
  const never = adapters.filter((a) => !measured.has(a.id))
  // A result carries a fingerprint of the adapter code it ran. One that no
  // longer matches means the adapter has changed since. Results from before
  // fingerprints were recorded cannot be checked either way.
  const stale = ok.filter((r) => r.source && r.source !== adapterFingerprint(taskId, adapterOf(r.file)))
  const unchecked = ok.filter((r) => !r.source).length
  const newest = results.map((r) => r.measuredAt).filter(Boolean).sort().at(-1)
  console.log(`\n${taskId}\n  ${adapters.length} adapters, ${ok.length} results across runtimes${newest ? `, last measured ${age(newest)}` : ''}`)
  const report = (label, items, show) => {
    if (items.length === 0) return
    problems += items.length
    console.log(`  ${label}: ${items.length}`)
    for (const item of items) console.log(`    ${show(item)}`)
  }
  report('never measured', never, (a) => a.id)
  report('failed or could not run', failed, (r) => `${r.file.replace(/\.json$/, '')}: ${String(r.error ?? r.status).split('\n')[0].slice(0, 110)}`)
  report(`measured with an older harness (now ${HARNESS_VERSION})`, old, (r) => `${r.file.replace(/\.json$/, '')}: harness ${r.harness}`)
  report('adapter changed since it was measured', stale, (r) => r.file.replace(/\.json$/, ''))
  if (unchecked) console.log(`  ${unchecked} results predate change tracking, so whether their adapters changed since is unknown`)
  if (all) for (const r of ok) console.log(`    ok  ${r.file.replace(/\.json$/, '')}  ${age(r.measuredAt)}`)
}

// Type checks for the npm and JSR packages that have adapters.
const types = await readJson(fromRoot('data/types.json'), { packages: {} })
const untyped = new Set()
for (const taskId of taskIds()) {
  for (const adapter of await adaptersOf(taskId)) {
    const [registry, ...rest] = adapter.id.split('/')
    const name = adapter.package ?? rest.join('/')
    if ((registry === 'npm' || registry === 'jsr') && types.packages[name]?.status !== 'ok') untyped.add(`${name}${types.packages[name] ? ` (${types.packages[name].status})` : ''}`)
  }
}
console.log(`\ntype checks\n  ${Object.values(types.packages).filter((p) => p.status === 'ok').length} packages checked`)
if (untyped.size) {
  problems += untyped.size
  console.log(`  measured packages without a usable check: ${untyped.size}\n${[...untyped].map((n) => `    ${n}`).join('\n')}`)
}

console.log(problems ? `\n${problems} thing${problems === 1 ? '' : 's'} to look at. "npm run refresh" measures what is missing; add --force to redo what is there.` : '\nEverything is measured and current.')
