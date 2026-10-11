// Measure every task, one after another: overlapping measurements would
// compete for CPU. Tasks are found on disk, so a new one needs no change here.
// Flags are passed on to scripts/measure.mjs (--force, --reps=3, --runtimes=…).
// --shard=<i>/<n> measures only machine i's share when n identical machines
// measure at once (see shardTasks and "Several machines" in benchmarks/README.md).
// Usage: node scripts/measure-all.mjs [--tasks=<category>/<task>,…] [--shard=<i>/<n>] [measure.mjs flags]
import { duration, runStep, shardTasks, taskIds } from './lib/tasks.mjs'
import { raisePriority } from './lib/util.mjs'
// Above the usual priority where the machine allows it (see raisePriority).
raisePriority()

const argv = process.argv.slice(2)
const wanted = argv.find((a) => a.startsWith('--tasks='))?.slice('--tasks='.length).split(',')
const shard = argv.find((a) => a.startsWith('--shard='))?.slice('--shard='.length)
const passed = argv.filter((a) => !a.startsWith('--tasks=') && !a.startsWith('--shard='))
const known = taskIds()
const unknown = (wanted ?? []).filter((id) => !known.includes(id))
if (unknown.length) {
  console.error(`unknown task: ${unknown.join(', ')}\nknown tasks: ${known.join(', ')}`)
  process.exit(1)
}

// Tasks differ in length, but on average they are alike, so the time left is
// the average so far times the tasks to go.
let tasks = wanted ?? known
if (shard) {
  const [index, count] = shard.split('/').map(Number)
  if (!(Number.isInteger(index) && Number.isInteger(count) && index >= 1 && index <= count)) {
    console.error(`--shard=${shard}: expected <i>/<n> with 1 <= i <= n, such as --shard=3/8`)
    process.exit(1)
  }
  const share = shardTasks(tasks, index, count)
  tasks = share.tasks
  console.error(`shard ${index} of ${count}: ${tasks.length} tasks, about ${duration(share.seconds)} by the last run's times`)
}
const started = Date.now()
const elapsed = () => Math.round((Date.now() - started) / 1000)
const steps = []
for (const [index, task] of tasks.entries()) {
  const left = index ? `, about ${duration(Math.round((elapsed() / index) * (tasks.length - index)))} left` : ''
  const step = runStep(`[${index + 1}/${tasks.length}] measure ${task}  (${duration(elapsed())} so far${left})`, process.execPath, ['scripts/measure.mjs', task, ...passed])
  steps.push({ ...step, title: `measure ${task}` })
}
console.error(`\n${steps.map((s) => `${s.ok ? 'ok    ' : 'FAILED'}  ${s.title}  (${duration(s.seconds)})`).join('\n')}`)
const failed = steps.filter((s) => !s.ok).length
console.error(`\n${steps.length - failed} of ${steps.length} tasks measured${failed ? `, ${failed} failed` : ''}, in ${duration(elapsed())}.`)
if (failed) process.exitCode = 1
