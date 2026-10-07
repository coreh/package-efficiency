// Task kind "async-operation": one awaited (or joined) call per operation.
// The protocol, the warm-up, the rounds and the figures are those of a
// synchronous operation (measureOperation in supervisor.mjs); the awaiting is
// done by the runner of each language. What this adds is one check that only
// matters once an operation can wait: a round must be work, not waiting.
//
// CPU time is what is graded, so an operation that sleeps, or waits on a
// timer with a real delay, would cost almost nothing here while keeping a
// real program waiting. Such a task is refused instead of ranked: when a
// measured round used less CPU than MIN_BUSY of its wall-clock time, the run
// fails.
//
// The share is low on purpose, because honest work is not always on the CPU:
// - A turn of Node's event loop, and of Python's asyncio loop, is a system
//   call (kevent), and on macOS the thread is switched out at each one: a job
//   that yields one turn used 0.17 to 0.4 of its wall-clock time in Node
//   (Bun and Deno, which skip the call, about 1.0).
// - Threads that block on each other (a full channel, a held lock) leave the
//   process idle while the system wakes the next one: PyPy used 0.21 with
//   five threads on a small channel.
// A one-millisecond timer per operation uses about 0.02. A sleep much shorter
// than that is not caught: this is a backstop for the rule in the README, not
// a proof. A machine too busy to give the process this much cannot measure
// anything else either.
import { measureOperation } from './supervisor.mjs'

export const MIN_BUSY = 0.08
// Below this a round is too short for the ratio to mean anything.
const MIN_ROUND_MS = 10

export async function measureAsyncOperation(options) {
  const run = await measureOperation(options)
  if (run.status !== 'ok') return run
  const waiting = run.rounds.find((round) => round.wallMs >= MIN_ROUND_MS && round.cpuMs < MIN_BUSY * round.wallMs)
  if (waiting) {
    return {
      status: 'failed',
      error: `the operations wait instead of working: a round of ${waiting.wallMs.toFixed(0)} ms used ${waiting.cpuMs.toFixed(1)} ms of CPU. A measured call must not sleep or wait on a timer with a real delay (see "Asynchronous operations" in benchmarks/README.md).`,
    }
  }
  return run
}
