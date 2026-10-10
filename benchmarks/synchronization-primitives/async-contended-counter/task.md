# Increment one counter under an async lock from eight tasks that yield inside it

One operation creates one async lock and one counter that starts at 0, starts
eight tasks on one thread, and waits for them. Each task repeats `turns` times
(500, 1,000 or 2,000; three fixtures):

1. lock the shared lock, awaiting it while another task holds it;
2. read the counter into `ticket`;
3. yield to the scheduler once, still holding the lock;
4. write `ticket + 1` back to the counter;
5. unlock;
6. add `ticket` to the task's own sum (outside the lock).

When the tasks have finished, the operation returns `{ count, sum }`: the
counter and the total of the eight tasks' sums. A correct output has
`count = 8 × turns` and `sum` equal to the sum of the integers from 0 to
`count - 1`. The yield inside the critical section is what makes the lock
necessary on one thread: without mutual exclusion the other seven tasks read
the same value while the first one is suspended, the counter ends at `turns`
and every ticket is handed out eight times. The check is exact; nothing is
forgiven, and the scenario asserts when it loads that a missing lock, one lost
update, one duplicated ticket and another fixture's result are refused. The
result exists only once every task has finished, so an operation cannot
return early. This is the single-thread, async counterpart of
`contended-counter`, with the same tickets and the same check.

This is an asynchronous task on **one thread** (`load.threads` is 1): the
tasks interleave, they never run in parallel. Each operation is one awaited
call (in Go, one call that blocks). Because every task yields while it holds
the lock, the other tasks that come round find it taken, so nearly every
acquisition suspends, waits in the lock's queue and is woken at the next
release. What is timed is creating the lock, starting the eight tasks, every
lock and unlock with the suspending and waking they cause, the yields, and
waiting for the tasks. The lock and the tasks are created inside the measured
call in every adapter, so their start-up is part of the figure; with 4,000 to
16,000 acquisitions per operation it is a small part. No timer or sleep with a
real delay is involved anywhere.

Packages run with their default options. The lock guards a plain integer in
every language (a `Mutex<u64>` where the crate owns its data); the lock is the
only synchronization. Only mutual exclusion is used: read-write locks,
semaphores and condition variables are other jobs. Whether a lock hands itself
to the longest waiter (fair) or lets the next caller take it is the package's
own behaviour and is not checked; where a constructor demands a choice, the
adapter says which in its notes.

The yield is the same in every adapter (see the shared methodology): JavaScript
one turn of the event loop, `await new Promise((r) => setImmediate(r))` with
`setImmediate` from `node:timers`; Python `await asyncio.sleep(0)`; Go
`runtime.Gosched()`; Rust `tokio::task::yield_now().await` on tokio and
`bench_harness::async_operation::yield_now().await` on any other executor.

Executors, as recorded with each result:

- JavaScript: the runtime's own event loop; the tasks are async functions
  started together and awaited with `Promise.all`.
- Python: one `asyncio` event loop for the whole run; the tasks are
  coroutines collected with `asyncio.gather` (for `anyio`, a task group's
  `start_soon` on the same loop).
- Go: goroutines with `GOMAXPROCS=1`, joined with a `sync.WaitGroup`.
- Rust: the eight tasks are futures of one task, joined in the operation's
  future with `futures::future::join_all`, not spawned tasks. Crates that work
  on any executor (`async-lock`, `futures-intrusive`) run on
  `futures::executor::block_on`; `tokio` runs the same join inside `block_on`
  of a current-thread runtime.

Packages and what each adapter calls:

- `@117/mutex` (JSR): `createMutex()`, `await mutex.acquire()` and
  `mutex.release()`.
- `@core/asyncutil` (JSR): `new Mutex()`, `await mutex.acquire()`, which
  returns a disposable lock, released by disposing it.
- `async-lock` (crates.io): `async_lock::Mutex::new(0u64)` and
  `lock().await`; the guard is dropped to unlock.
- `futures-intrusive` (crates.io): `futures_intrusive::sync::Mutex::new(0u64, false)`
  (its constructor requires the fairness flag) and `lock().await`.
- `tokio` (crates.io): `tokio::sync::Mutex::new(0u64)` and `lock().await`.
- `anyio` (PyPI): `anyio.Lock()` with `async with`; its acquire also passes
  through a cancellation checkpoint, which is what the package does and is
  counted.
- Python `asyncio.Lock()` (built-in): `async with lock`.
- Go `sync.Mutex` (built-in): `Lock()` and `Unlock()` between goroutines.

## Left out

- `event-listener` and `parking` (crates.io): notification primitives that a
  lock is built from, not a lock to take and release around a counter.
- Rust `std::sync::Mutex`: Rust has no standard-library entry yet, and a
  blocking lock held across an `await` is not this job.
- Ruby: no event loop in the standard library; `Mutex` between threads is in
  `contended-counter`.
- JavaScript has no lock in its standard library, so there is no built-in
  JavaScript entry, and one is not written by hand.

See [shared methodology](../../README.md) for timing and reproduction.
