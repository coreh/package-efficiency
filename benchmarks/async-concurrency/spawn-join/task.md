# Spawn 10,000 tasks that yield once and join them

One operation spawns 10,000 tasks on the executor that is running it, waits
for every one of them through the handle its spawn returned, and returns the
sum of the values the tasks returned. The input gives the number of tasks
(10,000), a multiplier, an offset and a modulus (65,521); task `i` (0 to
9,999) returns `(i * multiplier + offset) % modulus`. There are 3 fixtures,
which differ only in the multiplier and the offset, so each has its own sum.

The task is the same in every adapter and deliberately does no work of its
own:

1. yield to the executor once (Python `await asyncio.sleep(0)`, Go
   `runtime.Gosched()`, Rust `tokio::task::yield_now().await` on tokio and
   `bench_harness::async_operation::yield_now().await` on every other
   executor, JavaScript one turn of the event loop, a promise resolved by
   `setImmediate`);
2. return `(i * multiplier + offset) % modulus`.

The operation spawns all 10,000 tasks first, in index order, keeping each
handle; then it awaits the handles in the same order and adds up their
values. It does not compute any value itself. The values stay below 2^31 at
every step, so the arithmetic is exact in every language.

A correct output is a single integer, compared exactly with the scenario's
own sum; nothing is forgiven. Because the value is worked out after the
yield, a task that was spawned and never resumed contributes nothing, and an
operation cannot return the right sum before every task has run to its end.
The scenario asserts when it loads that a sum missing the first or the last
task, a sum with one task counted twice, indices counted from one, another
fixture's sum, the number of tasks, the right sum as a string and `null` are
all refused.

This is an asynchronous task on **one thread** (`load.threads` is 1): the
tasks interleave, they never run in parallel. Each operation is one awaited
call (in Go, one call that blocks). What is timed is spawning 10,000 tasks,
the executor polling each of them twice (once up to its yield, once to its
end), and joining them through their handles. The tasks are spawned inside
the measured call in every adapter. The executor itself is the one that runs
the whole run, created once before the first operation, as Python's event
loop, Go's scheduler and JavaScript's event loop already are: a tokio
runtime, a `LocalExecutor` or a `LocalPool` is built once in `main` and
drives every operation, and the operation spawns onto it. No timer or sleep
with a real delay is involved anywhere.

With jobs this small, the figure is the executor: allocating each task,
putting it on the run queue, waking it after its yield, storing its output
and handing it to whoever awaits the handle. This is the measure of what one
spawned task costs, not of any work done in it.

Packages run with their default settings apart from what keeps them on one
thread.

Entries, and what each calls:

- Rust `tokio`: a `new_current_thread()` runtime whose `block_on` drives the
  run; `tokio::spawn` per task and `handle.await` on each `JoinHandle`.
- Rust `futures`: a `futures::executor::LocalPool` whose `run_until` drives
  the run; `spawner.spawn_local_with_handle(task)` per task (a clone of the
  pool's `LocalSpawner`) and `.await` on each `RemoteHandle`.
- Rust `async-executor`: one `LocalExecutor`, driven by
  `futures_lite::future::block_on(executor.run(main))`; `executor.spawn(task)`
  per task and `.await` on each `Task`.
- Rust `async-global-executor`: `async_global_executor::block_on` drives the
  run; `async_global_executor::spawn_local(task)` per task and `.await` on
  each `Task`. This crate is built on `async-executor` (its local executor is
  an `async_executor::LocalExecutor` kept in a thread-local), so a large share
  of its figure is `async-executor`'s; what differs is its own spawning path
  and `block_on`. Its global, multi-thread executor is never started: only
  `spawn_local` is used.
- Built-in, Python: `asyncio.TaskGroup`, `create_task` per task; the group
  waits for all of them when its `async with` block ends, and the values are
  read with `result()` in spawn order.
- Built-in, Go: one `go` statement per task with `GOMAXPROCS=1`. Go has no
  join handle, so each goroutine writes its value at its index and a
  `sync.WaitGroup` is the join; the values are added after `Wait`.
- Built-in, JavaScript (for reference): one call of an async function per
  task, with `Promise.all` over the promises as the join. JavaScript has no
  spawn apart from calling an async function, which runs it at once up to
  its first `await`; that is the nearest thing, and it is listed so that the
  cost of a promise-based task can be set beside a spawned one.

Executors, as recorded with each result:

- Rust: each crate's own single-thread executor, as above.
- Python: one `asyncio` event loop for the whole run.
- Go: goroutines with `GOMAXPROCS=1`.
- JavaScript: the runtime's own event loop.

## Left out

- `smol`: its `LocalExecutor` is `async-executor`'s, re-exported; that
  crate, which does the work, is the entry.
- Ruby: no event loop or task spawning in its standard library.
- Thread pools and multi-thread executors: this task is on one thread; the
  pools are in `thread-pool-map`.

See [shared methodology](../../README.md) for timing and reproduction.
