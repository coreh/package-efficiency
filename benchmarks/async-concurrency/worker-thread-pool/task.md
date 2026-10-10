# Run 64 CPU jobs on a pool of 4 JavaScript worker threads

One operation creates a pool of exactly four JavaScript worker threads running
the task's worker module, submits 64 calls of the same CPU job to it, waits
for all of them, returns the 64 results in input order, and shuts the pool
down. The input is a list of 64 seeds (non-zero 32-bit integers) and a list of
64 round counts; job `i` is `job(seeds[i], rounds[i])`. There are 3 fixtures,
each 512,000,000 rounds of work in all:

- even: every job 8,000,000 rounds;
- varied: jobs of 4,000,000 to 12,000,000 rounds, in pairs that add up to
  16,000,000;
- skewed: 60 jobs of 4,000,000 rounds and, every sixteenth, a job of
  68,000,000.

The job runs in the workers, and its code is the same in every entry: the
worker module each adapter writes holds this function, and only what the
package needs around it (its worker class, its export) differs:

```js
const job = (seed, rounds) => {
  let x = seed >>> 0
  for (let r = 0; r < rounds; r++) {
    x = (x ^ (x << 13)) >>> 0
    x = (x ^ (x >>> 17)) >>> 0
    x = (x ^ (x << 5)) >>> 0
  }
  return x
}
```

That is, `rounds` steps of xorshift32 from `seed`, every operation modulo
2^32, as in `thread-pool-map`. A worker is given one job's seed and round
count and answers with its value; nothing else crosses between threads.

A correct output is the list of the 64 values `job(seeds[i], rounds[i])` in
input order, compared exactly. The scenario does not get them by running the
loop (1.5 billion steps each time it is loaded): one step of xorshift32 is
linear over GF(2), so it raises the step's 32-by-32 bit matrix to the power
`rounds` by repeated squaring, and checks when it loads that this agrees with
the loop for 0 to 69 steps and a few longer counts. A pool that drops a job,
writes a result at the wrong index, or returns results in the order they
finished fails. Because every value comes from its job, an operation cannot
return before all of them have run. The scenario asserts when it loads that
the seeds returned unchanged, the results reversed or rotated by one, a list
with one job left undone, one job run a step short or one result missing,
the results as text, and another fixture's results are all refused.

This is a task on **four threads** (`load.threads` is 4): four worker threads
run the jobs, and the main thread hands them out and gathers the results. The
pool is created inside the measured call in every adapter, so starting its
four workers (on every runtime an isolate of its own each, with the worker
module loaded into it) and stopping them is part of the figure. That costs
about 50 to 100 ms of CPU per operation, against about a second for the jobs,
so roughly a tenth of the figure. Each new worker also starts the job cold and
warms it up again, which is the same for every entry. CPU time is counted for
the whole process, all threads together: a pool that spins while it waits
pays for that, and wall-clock time, where parallelism shows, is not what is
ranked. Nothing sleeps.

Most of the figure is the engine running the loop, the same for every entry
on a runtime. What separates entries is the pool's own share: starting its
workers and whatever it loads into each of them besides the worker module,
passing 64 inputs and 64 results as messages, its scheduling, and how it
shuts down. A pool that loads a large runtime of its own into every worker
pays for it here.

The worker module is written by each adapter, beside its `adapter.js`, when
the adapter is loaded: once per process, outside the measured calls. The
harness copies only `adapter.js` and `scenario.mjs` into the adapter's
folder, and every pool here wants a file. It is the function above with what
the package needs around it, nothing more.

Packages run with their default settings; the number of workers is the only
option given, plus what a package needs to run on threads rather than
processes. Where a package hands back results by index rather than in order,
the adapter puts each result at its index inside the measured call, as the
built-in entries do. The pool is destroyed (or ended) and awaited before the
operation returns.

Entries, and what each calls:

- JSR `@poolifier/poolifier`: `new FixedThreadPool(4, workerFile)`, then
  `Promise.all(inputs.map((x) => pool.execute(x)))`, then
  `await pool.destroy()`. The worker module is
  `export default new ThreadWorker(({ seed, rounds }) => job(seed, rounds))`.
- JSR `@poolifier/poolifier-web-worker`: the same on Web Workers,
  `new FixedThreadPool(4, new URL(workerFile))`; the worker module uses that
  package's `ThreadWorker`. Deno and Bun only, since Node has no global
  `Worker`.
- npm `jest-worker`: `new Worker(workerPath, { numWorkers: 4,
  enableWorkerThreads: true, exposedMethods: ['job'] })`, one
  `worker.job(seed, rounds)` per input, `Promise.all`, then
  `await worker.end()`. Its worker module is CommonJS (`worker.cjs`,
  `exports.job = job`), because jest-worker loads it with `require`.
- Built-in, `node:worker_threads`: four `new Worker(file)`, each handed the
  next `[index, seed, rounds]` by `postMessage` as soon as it answers, results
  placed by index, then `terminate()` on each. Node, Bun and Deno.
- Built-in, Web Workers: the same with the global
  `new Worker(url, { type: 'module' })`, `onmessage` and `terminate()`. Bun
  and Deno only.

The runtimes have no pool type of their own. Four workers fed from a shared
counter are the built-in pool, as Go's goroutines and Ruby's threads are in
`thread-pool-map`.

Threads, as recorded with each result: four worker threads of the runtime,
each with its own isolate (Node, Deno) or its own JavaScript context (Bun),
and the main thread's event loop.

## Left out

- Pools of child processes (`jest-worker` without `enableWorkerThreads`,
  poolifier's `FixedClusterPool`, `workerpool` with processes): the harness
  counts only the calling process's CPU, so the work done in the child
  processes would not be measured.
- `piscina`, `tinypool` and `workerpool` are not in the catalog yet; each
  would join with its own worker module around the same job.
- No entry in another language: these are JavaScript worker-thread pools.
  `thread-pool-map` compares thread pools that share memory in Rust, Go,
  Python and Ruby.

See [shared methodology](../../README.md) for timing and reproduction.
