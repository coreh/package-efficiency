// What scripts/measure.mjs needs for a task of kind "async-operation": which
// runner each language uses, the environment that fixes the thread count, and
// what is written into each result about concurrency. The measuring itself is
// in harness/async-operation.mjs; the rules are in benchmarks/README.md,
// "Asynchronous operations".
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fromRoot } from './util.mjs'

export { measureAsyncOperation } from '../../harness/async-operation.mjs'

export const ASYNC_KIND = 'async-operation'

// JavaScript and Python await inside one event loop, so they have their own
// runners. A Ruby or Go operation blocks until its threads or goroutines are
// done, which the synchronous runners already time; Rust adapters choose
// between bench_harness::async_operation::run and operation::run_prepared.
export const ASYNC_JS_RUNNER = fromRoot('harness/js/async-operation-runner.mjs')
export const asyncNativeRunner = (language, ext) => (language === 'python' ? fromRoot('harness/python/async-runner.py') : fromRoot('harness', language, `runner.${ext}`))

// task.json `load.threads` and `load.concurrency` are part of the task: how
// many threads run the task's code at once, and how many units of work
// (jobs, producers, callers) are in flight. Both are in `load`, so changing
// either measures the task again.
export function checkAsyncTask(task) {
  const { threads, concurrency } = task.load ?? {}
  if (!Number.isInteger(threads) || threads < 1) throw new Error('an async-operation task needs load.threads (a positive integer) in task.json')
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error('an async-operation task needs load.concurrency (a positive integer) in task.json')
}

// The thread count as the process sees it. Go takes GOMAXPROCS from the
// environment; BENCH_THREADS is there for any adapter that wants to read it
// rather than repeat the number.
export const asyncEnv = (task) => ({ BENCH_THREADS: String(task.load.threads), GOMAXPROCS: String(task.load.threads) })

// Stored in every result: the task's thread count and concurrency, and the
// executor the adapter says it runs on (adapter.json `executor`).
export function concurrencyRecord(task, adapterDir) {
  const meta = JSON.parse(readFileSync(path.join(adapterDir, 'adapter.json'), 'utf8'))
  return { threads: task.load.threads, concurrency: task.load.concurrency, executor: meta.executor ?? null }
}
