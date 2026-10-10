# Map a CPU job over 256 inputs on a pool of 4 threads

One operation creates a pool of exactly four threads, submits 256 calls of the
same CPU job to it, waits for all of them, returns the 256 results in input
order, and shuts the pool down. The input is a list of 256 seeds (non-zero
32-bit integers) and a list of 256 round counts; job `i` is
`job(seeds[i], rounds[i])`. There are 3 fixtures, each 512,000 rounds of work
in all:

- even: every job 2,000 rounds;
- varied: jobs of 501 to 3,499 rounds, in pairs that add up to 4,000;
- skewed: 240 jobs of 1,000 rounds and, every sixteenth, a job of 17,000.

The job is the same in every adapter, written out in the language's plain
loop, with every operation modulo 2^32 (Rust `u32`, Go `uint32`, Python and
Ruby integers masked with `0xFFFFFFFF`):

1. `x = seed`;
2. `rounds` times: `x ^= x << 13`, then `x ^= x >> 17`, then `x ^= x << 5`
   (xorshift32);
3. return `x`.

A correct output is the list of the 256 values `job(seeds[i], rounds[i])` in
input order, compared exactly with the scenario's own computation of the same
loop. A pool that drops a job, writes a result at the wrong index, or returns
results in the order they finished fails. Because every value comes from its
job, an operation cannot return before all of them have run. The scenario
asserts when it loads that the seeds returned unchanged, the results reversed
or rotated by one, a list with one job left undone or one result missing, and
another fixture's results are all refused.

This is a task on **four threads** (`load.threads` is 4). The pool is created
inside the measured call in every adapter, so starting its four threads (and,
where the package does so, stopping them) is part of the figure; the jobs are
sized so that this is a small share of it. What is timed is creating the pool,
submitting the jobs, running them, gathering the results in order and shutting
the pool down. CPU time is counted for the whole process, all threads
together: a pool that spins while it waits pays for that, and wall-clock time,
where parallelism shows, is not what is ranked. Nothing sleeps.

Most of the figure is the language running the loop: 512,000 rounds take
well under a millisecond in Rust and Go and a large part of a second in
CPython and CRuby. The pool's own share (handing out 256 jobs and gathering
256 results) is what separates entries of one language. CPython and CRuby run
one thread at a time under their interpreter lock, so their four threads take
turns and gain no parallelism; their CPU time is still the graded figure, and
the work is the same as in every other entry. PyPy also has an interpreter
lock.

Packages run with their default settings; the number of threads is the only
option given. Where a package hands back results by index rather than in
order (a channel, a shared array), the adapter puts each result at its index
inside the measured call, as the built-in entries do.

Entries, and what each calls:

- Rust `rayon`: `ThreadPoolBuilder::new().num_threads(4).build()`, then
  `pool.install(|| inputs.par_iter().map(job).collect())`.
- Rust `threadpool`: `ThreadPool::new(4)`, one `execute` per input sending
  `(index, value)` back over a `std::sync::mpsc` channel, results placed by
  index, then `join`.
- Ruby `concurrent-ruby`: `Concurrent::FixedThreadPool.new(4)`, one
  `Concurrent::Promises.future_on(pool) { job(...) }` per input, then
  `value!` on each in order; the pool is shut down and awaited.
- Ruby `parallel`: `Parallel.map(indices, in_threads: 4) { |i| job(...) }`.
- Python `joblib`: `Parallel(n_jobs=4, prefer="threads")(delayed(job)(s, r) for ...)`.
- Python `multitasking`: `set_max_threads(4)`, a `@multitasking.task` function
  that writes its result at its index, then `wait_for_tasks()`. This package
  starts one thread per call and lets at most four run at once, rather than
  keeping four threads; that is how it works, and its cost is counted.
- Built-in, Python: `concurrent.futures.ThreadPoolExecutor(max_workers=4)`
  and `executor.map`, inside `with` so that the workers are joined.
- Built-in, Go: four worker goroutines ranging over a closed, buffered channel
  of indices, with `GOMAXPROCS=4` (Go has no pool type in its standard
  library; goroutines on four processors are its pool).
- Built-in, Ruby: four `Thread` workers popping indices from a closed
  `Thread::Queue` (Ruby has no pool class in its core library).

Threads, as recorded with each result:

- Rust: the pool's four threads; the calling thread waits.
- Go: four goroutines with `GOMAXPROCS=4`.
- Python: the pool's threads, one at a time under the interpreter lock.
- Ruby: `Thread`, likewise one at a time under the interpreter lock.

## Left out

- Process pools (`billiard`, `joblib` with its default `loky` backend,
  `parallel` with `in_processes`, `multiprocessing.Pool`): the harness counts
  only the calling process's CPU, so the work done in the child processes
  would not be measured.
- The cargo crate `blocking`: its pool grows on demand and has no fixed size,
  so it cannot be held to four threads.
- JavaScript: no entry. The npm worker pools (`piscina`, `workerpool`) run
  each worker in its own isolate and pass inputs and results as messages,
  which is other work than a thread pool sharing memory.

See [shared methodology](../../README.md) for timing and reproduction.
