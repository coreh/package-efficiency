// Lists the tasks that have an adapter with no result on some runtime it is
// meant to run on: what is written and has not been run yet.
// Usage: node scripts/unmeasured.mjs [--json]
import { existsSync, globSync } from 'node:fs'
import { adaptersOf, taskIds } from './lib/tasks.mjs'
import { fromRoot, readJson } from './lib/util.mjs'

const tasks = []
for (const taskId of taskIds()) {
  // A task still being written (task.json "draft": true) is not listed: its
  // check may still change, and a result kept from before would not match it.
  if ((await readJson(fromRoot('benchmarks', taskId, 'task.json'))).draft) continue
  const missing = []
  for (const adapter of await adaptersOf(taskId)) {
    if (adapter.id.startsWith('_')) continue
    // Results live at results/<task>/<adapter id>/<version>/<runtime>.json.
    const found = globSync(`${adapter.id.replace(/[[\]*?{}]/g, '\\$&')}/*/*.json`, { cwd: fromRoot('results', taskId) })
    if (found.length === 0 || !existsSync(fromRoot('results', taskId))) missing.push(adapter.id)
  }
  if (missing.length) tasks.push({ task: taskId, missing })
}
if (process.argv.includes('--json')) console.log(JSON.stringify(tasks))
else {
  for (const { task, missing } of tasks) console.log(`${task}: ${missing.length}  ${missing.slice(0, 6).join(' ')}${missing.length > 6 ? ' …' : ''}`)
  console.log(`${tasks.length} tasks, ${tasks.reduce((sum, t) => sum + t.missing.length, 0)} adapters without a result`)
}
