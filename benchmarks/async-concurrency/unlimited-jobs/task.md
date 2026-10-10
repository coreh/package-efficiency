# Run all jobs at once and collect results in order

One operation takes a list of N integers (100, 1,000 or 4,000), starts one
asynchronous job per integer with no limit on how many are in flight, waits
for all of them, and returns their results in input order together with the
largest number of jobs that were in flight at once. There are 3 fixtures, one
per N, each with its own values. This is `limited-jobs` without the limit.

The job is the same in every adapter, and deliberately does no work of its own:

1. count itself in: add one to a counter of jobs in flight, and remember the
   highest value the counter has had;
2. yield to the scheduler once (JavaScript one turn of the event loop, a
   promise resolved by `setImmediate` imported from `node:timers`; Python
   `await asyncio.sleep(0)`);
3. count itself out and return `value * 2 + 1`.

A correct output is `{ results, peak }` where `results` is every job's value in
input order and `peak` is exactly N: with nothing limiting them, every job has
been started and counted in before the first one comes back from its yield.
An entry that runs the jobs one after another, or in batches, gives a lower
peak; one that collects the values in the order the jobs finish, or loses or
repeats one, gives the wrong list. Because the results come from the jobs
themselves, an operation cannot return before all of them have finished.
Both are compared exactly; nothing is forgiven. The scenario asserts when it
loads that a peak of 1 or of N - 1, the results reversed or sorted, a result
missing at either end or repeated, the input values themselves, the results
as strings or off by two, and `null` are all refused.

This is an asynchronous task on **one thread** (`load.threads` is 1): the jobs
interleave, they never run in parallel. Each operation is one awaited call.
What is timed is handing the N jobs to the package, the package starting each
of them and collecting each value at its index, the scheduling of the runtime
that interleaves them, and noticing that the last one has finished. No timer
or sleep with a real delay is involved anywhere.

Packages run with their default settings. Where a package takes a list of
task functions rather than a list of values and a function to map over it
(`run-parallel`, `async.parallel`, `neo-async`'s `parallel`), the adapter
builds one closure per value inside the measured call, as `Promise.all`'s
entry builds one promise per value with `map`: that is how the package is
used for this job. A callback-style package is wrapped in one `Promise` for
the whole operation, not one per job.

Entries, and what each calls:

- `run-parallel`: `parallel(tasks, callback)` with one callback-style task per
  value, `(cb) => { count in; setImmediate(() => { count out; cb(null, v * 2 + 1) }) }`.
- `asynckit`: `asynckit.parallel(values, iterator, callback)` with a
  callback-style `iterator(value, cb)` doing the same steps.
- `async`: `async.parallel(tasks)` with one async function per value and no
  callback, so it returns a promise.
- `neo-async`: `neoAsync.parallel(tasks, callback)` with one callback-style
  task per value.
- `p-map`: `pMap(values, job, { concurrency: Infinity })`, its documented way
  of running without a limit.
- Built-in, JavaScript: `Promise.all(values.map(job))` with an async job.
- Built-in, Python: `asyncio.gather(*[job(v) for v in values])`, which wraps
  each coroutine in a task and returns the values in input order.

Executors, as recorded with each result:

- JavaScript: the runtime's own event loop; a yield is one turn of it
  (`setImmediate`). A microtask would not do: it is the yield every other
  task in this category uses, and with `await null` the cost of the turn
  would drop out for some entries and not others. Node makes a system call
  per turn and Bun and Deno do not, which is why Node's figures are higher for
  every entry here.
- Python: one `asyncio` event loop for the whole run; a yield is one pass of
  the loop.

## Left out

- Go goroutines with a `sync.WaitGroup`: tried and left out. With
  `GOMAXPROCS=1`, the scheduler puts a newly started goroutine first in line
  and moves goroutines between its local and global run queues, so some jobs
  come back from `runtime.Gosched()` and finish before the last one has been
  started: the peak is below N even for 100 jobs. The peak cannot be checked
  exactly there, and checking only the list would make it a different task
  from every other entry's. Goroutines and their scheduling are measured in
  `spawn-join`.
- Ruby: no event loop in its standard library; threads are a different task
  (`thread-pool-map`).
- Rust: there is no standard-library entry for Rust, and no crate is listed
  for this job yet; spawning and joining tasks on one thread is
  `spawn-join`.
- Packages with a limit (`p-limit`, `fastq`, `async.mapLimit`): they are
  `limited-jobs`. `p-map` is here only because unlimited concurrency is an
  option it documents.

See [shared methodology](../../README.md) for timing and reproduction.
