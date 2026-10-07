# Run trivial async jobs through a concurrency limit

One operation takes a list of N integers (100, 400 or 1,600) and a limit K
(1, 4, 10 or 32), runs one asynchronous job per integer with at most K jobs in
flight, waits for all of them, and returns their results in input order
together with the largest number of jobs that were in flight at once. There
are 12 fixtures, one per pair of N and K.

The job is the same in every adapter, and deliberately does no work of its own:

1. count itself in: add one to a counter of jobs in flight, and remember the
   highest value the counter has had;
2. yield to the scheduler once (JavaScript `await null`, Python
   `await asyncio.sleep(0)`, Go `runtime.Gosched()`, Rust a future that returns
   `Pending` once after waking itself);
3. count itself out and return `value * 2 + 1`.

A correct output is `{ results, peak }` where `results` is every job's value in
input order and `peak` is exactly K. A limiter that lets more than K jobs in
gives a higher peak; one that runs them one after another, or that does not
start a waiting job as soon as a place is free, gives a lower one. Because the
results come from the jobs themselves, an operation cannot return before all
of them have finished.

This is an asynchronous task on **one thread** (`load.threads` is 1): the jobs
interleave, they never run in parallel. Each operation is one awaited call.
What is timed is creating the limiter, submitting the N jobs, the scheduling of
the runtime or executor that interleaves them, and collecting the results. No
timer or sleep with a real delay is involved anywhere.

Packages run with their default settings; the limit is the only option given.
The limiter is created inside the measured call in every adapter. Where a
package has more than one way to do this job, the adapter uses the one its
documentation shows for mapping over a list (`p-map`, `async.mapLimit`,
`@std/async` `pooledMap`) or for wrapping calls (`p-limit`, `fastq.promise`).

Executors, as recorded with each result:

- JavaScript: the runtime's own event loop; a yield is one microtask turn.
- Python: one `asyncio` event loop for the whole run; a yield is one pass of
  the loop, which costs more than a microtask and is the cheapest yield the
  language has.
- Go: goroutines with `GOMAXPROCS=1`.
- Rust `tokio`: a current-thread runtime; jobs are spawned tasks.
- Rust `futures`: `futures::executor::block_on`, which polls on the calling
  thread; the jobs are futures in one `buffered` stream, not spawned tasks.

Not compared here: worker-process and worker-thread pools (`jest-worker`,
poolifier), which run jobs in parallel on other threads, and packages with no
limit (`run-parallel`) or another purpose (`p-locate`).

See [shared methodology](../../README.md) for timing and reproduction.
