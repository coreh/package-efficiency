// Run everything, in order: set the machine up, measure every task, measure
// the type checks, build the site, run the tests. Stops at the first step
// that fails, since each depends on the ones before it. The measure step is
// the exception: entries that fail there are recorded, and the run goes on.
//
// Everything graded is CPU time, so run this on an otherwise idle machine and
// leave it alone until it finishes; a full run takes a long while.
//
// Usage: node scripts/refresh.mjs [--only=measure,build] [--skip=setup] [--anyway] [--incremental] [measure flags]
//   steps: setup, measure, checks, build, test
//   --anyway         start even if another measurement is running or the machine is busy
//   --incremental    in the checks step, measure only what has no type-check result yet
//                    (the default measures every package again, which takes over an hour)
//   other flags      go to the measure step (--force, --keep-existing, --retry-failed, --reps=5,
//                    --runtimes=node,bun, --tasks=…)
import { execFileSync } from 'node:child_process'
import os from 'node:os'
import { duration, runStep } from './lib/tasks.mjs'

const argv = process.argv.slice(2)
const list = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3).split(',')
const [only, skip] = [list('only'), list('skip') ?? []]
const anyway = argv.includes('--anyway')
const incremental = argv.includes('--incremental')
const measureFlags = argv.filter((a) => !/^--(only|skip)=/.test(a) && a !== '--anyway' && a !== '--incremental')

const STEPS = {
  setup: () => [runStep('setup', process.execPath, ['scripts/setup.mjs'])],
  measure: () => [runStep('measure every task', process.execPath, ['scripts/measure-all.mjs', ...measureFlags])],
  checks: () => [runStep('type checks', process.execPath, ['scripts/refresh-checks.mjs', ...(incremental ? ['--incremental'] : [])])],
  build: () => [runStep('build the data', process.execPath, ['scripts/build-data.mjs']), runStep('build the site', process.execPath, ['scripts/build-site.mjs'])],
  test: () => [runStep('tests', 'npm', ['test', '--silent'])],
}
const unknown = [...(only ?? []), ...skip].filter((id) => !STEPS[id])
if (unknown.length) {
  console.error(`unknown step: ${unknown.join(', ')}\nsteps: ${Object.keys(STEPS).join(', ')}`)
  process.exit(1)
}
const chosen = Object.keys(STEPS).filter((id) => (only ? only.includes(id) : true) && !skip.includes(id))
const measuring = chosen.includes('measure') || chosen.includes('checks')

if (measuring && !anyway) {
  // Two measurements at once, or a busy machine, give figures that mean nothing.
  let running = ''
  try {
    running = execFileSync('pgrep', ['-fl', 'scripts/(measure|refresh-checks|sweep-setting)'], { encoding: 'utf8' }).split('\n').filter((line) => line && !line.includes('refresh.mjs') && !line.includes(String(process.pid))).join('\n')
  } catch {}
  if (running) {
    console.error(`Another measurement is running:\n${running}\nWait for it, or pass --anyway.`)
    process.exit(1)
  }
  const load = os.loadavg()[0] / os.cpus().length
  if (load > 0.25) {
    console.error(`This machine is busy (load ${os.loadavg()[0].toFixed(1)} on ${os.cpus().length} cores). Measurements taken now would be unreliable.\nClose what is running, or pass --anyway.`)
    process.exit(1)
  }
}

console.error(`steps: ${chosen.join(', ')}${measuring ? '\nLeave the machine idle until this finishes.' : ''}`)
const done = []
for (const id of chosen) {
  const results = STEPS[id]()
  done.push(...results)
  // An entry that crashes or fails its checks is recorded as such and the
  // rest is still measured, so a failed measure step does not hold up the
  // steps after it. It still shows as FAILED in the summary.
  if (results.some((r) => !r.ok) && id !== 'measure') break
}
const failed = done.find((s) => !s.ok)
const stopped = done.at(-1)?.ok === false ? done.at(-1) : null
console.error(`\n=== summary ===\n${done.map((s) => `${s.ok ? 'ok    ' : 'FAILED'}  ${s.title}  (${duration(s.seconds)})`).join('\n')}`)
if (failed && !stopped) console.error('\nFinished, but some entries failed to measure. They are listed above and recorded with their error.')
else if (stopped) console.error(`\nStopped at "${stopped.title}". Fix it and run again; finished work is kept, and measure skips results that are already there unless --force is given.`)
else console.error(`\nAll done in ${duration(done.reduce((sum, s) => sum + s.seconds, 0))}.`)
if (failed) process.exitCode = 1
