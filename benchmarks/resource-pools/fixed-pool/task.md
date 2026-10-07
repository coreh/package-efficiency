# Check resources out of a pool of 10 and return them, from many callers

One operation creates a pool of 10 reusable resources, starts C concurrent
callers (12, 32 or 64) that each run N cycles (50 to 150), waits for all of
them, and then reads the outcome from the resources. There are four fixtures.

A resource is a small object with two integers, `uses` and `sum`, both 0 when
it is created. The pool has a maximum size of 10 and a check-out waits while
all 10 are out. Caller `c` (0-based) runs cycles `j` from 0 to N-1:

1. check a resource out of the pool (waiting if none is free);
2. count it in: add one to the number of resources in use, and remember the
   highest value that number has had;
3. touch it: `uses += 1` and `sum += (c * 31 + j) % 97 + 1`;
4. yield to the scheduler once while holding it (Python `await asyncio.sleep(0)`,
   Go `runtime.Gosched()`, Rust `tokio::task::yield_now().await`, Ruby
   `Thread.pass`);
5. count it out and return it to the pool.

When every caller has finished, the operation checks out all 10 resources at
the same time (so a resource that was never returned would block it), adds up
their `uses` and `sum`, returns them, and gives
`{ cycles, checksum, peak, drained }`: the total `uses`, the total `sum`, the
highest number in use at once, and the number of resources checked out in that
last step.

The verifier requires `cycles = C * N`, `checksum` equal to the sum of every
cycle's touch value, `peak = 10` (more means the pool lent more than its size;
fewer means a waiting caller was not served when a resource came back) and
`drained = 10`. Because the totals come from the resources, an operation cannot
return before all cycles are done.

This is an asynchronous task on **one thread** (`load.threads` is 1): callers
interleave, they never run in parallel. The pool, the callers and (in Go and
Ruby) their goroutines or threads are created inside the measured call, so
their start-up is part of the figure. Each resource is created once per
operation: eagerly by the standard-library adapters, and on first use by
`deadpool`, which creates objects on demand up to its maximum size. No timer or
sleep with a real delay is involved.

Executors, as recorded with each result:

- Rust `deadpool`: tokio's current-thread runtime; callers are spawned tasks.
  `deadpool` is built on tokio's semaphore, so tokio is its runtime. The pool
  is `Pool::builder(manager).max_size(10).build()`; the default maximum size
  is a multiple of the CPU count, so the size is the one option given.
- Python: one `asyncio` loop, resources held in an `asyncio.Queue`.
- Go: goroutines with `GOMAXPROCS=1`, resources in a buffered channel.
- Ruby: one thread per caller with a `Thread::Queue`, taking turns under the
  interpreter lock. Ruby has no single-threaded asynchronous pool in its
  standard library; the interpreter lock keeps it to one running thread, but
  its threads are real and a thread switch costs more than a task switch.

Not compared here: `bytebufferpool` (Go), an unbounded pool of byte buffers
with no maximum size and no waiting, which is another job; `puddle` and
`connection_pool` are not entered in this edition, the decision for this task
being deadpool plus the standard-library entries.

See [shared methodology](../../README.md) for timing and reproduction.
