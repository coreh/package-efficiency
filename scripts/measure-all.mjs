// Run tasks sequentially: overlapping measurements would compete for CPU.
import { spawnSync } from 'node:child_process'
const tasks = ['html-escaping/text-attributes', 'deep-equality/nested-json', 'stable-json-stringify/nested-records', 'http-server/json-api']
let failed = false
for (const task of tasks) {
  const result = spawnSync(process.execPath, ['scripts/measure.mjs', task, ...process.argv.slice(2)], { stdio: 'inherit' })
  if (result.status !== 0) failed = true
}
if (failed) process.exitCode = 1
