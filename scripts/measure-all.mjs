// Measure every task, one after another: overlapping measurements would
// compete for CPU. Tasks are found on disk, so a new one needs no change here.
// Flags are passed on to scripts/measure.mjs (--force, --reps=3, --runtimes=…).
// Usage: node scripts/measure-all.mjs [--tasks=<category>/<task>,…] [measure.mjs flags]
import { duration, runStep, taskIds } from './lib/tasks.mjs'
import { raisePriority } from './lib/util.mjs'
// Above the usual priority where the machine allows it (see raisePriority).
raisePriority()

const argv = process.argv.slice(2)
const wanted = argv.find((a) => a.startsWith('--tasks='))?.slice('--tasks='.length).split(',')
const passed = argv.filter((a) => !a.startsWith('--tasks='))
const known = taskIds()
const unknown = (wanted ?? []).filter((id) => !known.includes(id))
if (unknown.length) {
  console.error(`unknown task: ${unknown.join(', ')}\nknown tasks: ${known.join(', ')}`)
  process.exit(1)
}

// Tasks differ in length, but on average they are alike, so the time left is
// the average so far times the tasks to go.
const tasks = wanted ?? known
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
