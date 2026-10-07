// Task kind "async-operation": one awaited (or joined) call per operation.
// The protocol, the warm-up, the rounds and the figures are those of a
// synchronous operation (measureOperation in supervisor.mjs); the awaiting is
// done by the runner of each language. What this adds is one check that only
// matters once an operation can wait: a round must be work, not waiting.
//
// CPU time is what is graded, so an operation that sleeps, or waits on a
// timer with a real delay, would cost almost nothing here while keeping a
// real program waiting. Such a task is refused instead of ranked: when a
// measured round used less CPU than a set share of its wall-clock time, the
// run fails.
//
// On one thread (task.json load.threads is 1) nothing but a timer, a sleep or
// outside I/O can make the process wait, and a run that never waits uses
// about 1.0 of its wall-clock time; the share required is MIN_BUSY. With
// several threads that block on each other (a full channel, a held lock) the
// process is idle for a moment whenever the system has to wake the next
// thread, and under an interpreter lock that is most of the time (PyPy used
// 0.24 with five threads on a channel of capacity 1). That is the cost of the
// hand-over and not a timer, so the share required there is only
// MIN_BUSY_THREADS, which a sleep of any length still fails. A machine too
// busy to give the process that much cannot measure anything else either.
import { measureOperation } from './supervisor.mjs'

export const MIN_BUSY = 0.25
export const MIN_BUSY_THREADS = 0.05
// Below this a round is too short for the ratio to mean anything.
const MIN_ROUND_MS = 10

export async function measureAsyncOperation(options) {
  const run = await measureOperation(options)
  if (run.status !== 'ok') return run
  const share = (options.load?.threads ?? 1) > 1 ? MIN_BUSY_THREADS : MIN_BUSY
  const waiting = run.rounds.find((round) => round.wallMs >= MIN_ROUND_MS && round.cpuMs < share * round.wallMs)
  if (waiting) {
    return {
      status: 'failed',
      error: `the operations wait instead of working: a round of ${waiting.wallMs.toFixed(0)} ms used ${waiting.cpuMs.toFixed(1)} ms of CPU. A measured call must not sleep or wait on a timer with a real delay (see "Asynchronous operations" in benchmarks/README.md).`,
    }
  }
  return run
}
