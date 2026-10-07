# Increment one shared counter under a lock from four threads

One operation creates one lock and one counter that starts at 0, starts four
threads, and joins them. Each thread repeats `turns` times (2,000, 10,000 or
50,000; three fixtures):

1. lock the shared lock;
2. read the counter into `ticket`, write `ticket + 1` back;
3. unlock;
4. add `ticket` to the thread's own sum (outside the lock).

When the threads are joined, the operation returns
`{ count, sum }`: the counter read under the lock and the total of the four
threads' sums. A correct output has `count = 4 × turns` and `sum` equal to the
sum of the integers from 0 to `count - 1`. If two threads were ever in the
critical section together, an update would be lost or a ticket handed out
twice, and the output would be wrong. The result exists only once all threads
have finished, so an operation cannot return early.

This is a task on **four threads** (`load.threads` is 4; the calling thread
only joins). What is timed is creating the lock, starting and joining the
threads, and every lock and unlock with the waiting and waking they cause. CPU
time is counted for the whole process. A lock that spins before it parks pays
for that in CPU time, and one that parks at once pays in system calls; both are
what the package does. Nothing sleeps. The critical section is deliberately
tiny, so the figure is that of the lock, but it also depends on the machine's
scheduling and varies from round to round.

Packages are used with default options. The lock guards a plain integer in
every language (a `Mutex<u64>` where the crate owns its data); the lock is the
only synchronization. Only mutual exclusion is used: read-write locks,
condition variables, thread parking and async locks are other jobs and are not
here. Left out: `parking_lot_core`, `parking`, `event-listener` and
`async-lock` (building blocks or async notification, not a lock to take and
release around a counter). `std::sync::Mutex` cannot be listed, as Rust has no
standard-library entry yet. No npm or JSR package takes part. The Ruby `sync` gem and the Go module `moby/locker` do this job, but the harness runs PyPI, RubyGems and Go module adapters only in synchronous tasks, so they are not entered.

Threads, as recorded with each result:

- Rust: `std::thread::scope`, four spawned threads.
- Go: four goroutines, with `GOMAXPROCS=4`.
- Python: `threading.Thread`; CPython and PyPy run one thread at a time under
  the interpreter lock, so the threads take turns.
- Ruby: `Thread`, likewise one at a time under the interpreter lock.

See [shared methodology](../../README.md) for timing and reproduction.
