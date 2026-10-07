# Send from four threads to one through a bounded channel

One operation creates a bounded channel of capacity C (1, 16 or 1,024), starts
four producer threads, and receives on the calling thread. Producer `p` (0 to
3) sends the M integers `i * 4 + p` for `i` from 0 to M - 1 (M is 250, 1,000 or
4,000), blocking whenever the channel is full. The consumer receives exactly
4 × M messages, blocking whenever the channel is empty, then joins the
producers. There are 9 fixtures, one per pair of M and C.

For every message `v` the consumer works out its producer (`v % 4`) and its
position (`v / 4`), checks that it is the next one expected from that
producer, and adds `v` to a sum. A correct output is
`{ count, sum, ordered }`: `count` is 4 × M, `sum` is the sum of all the
integers from 0 to 4 × M - 1 (so nothing was lost or delivered twice) and
`ordered` is true (so the channel kept each sender's order). The result exists
only once every message has been received, so an operation cannot return
early.

This is a task on **five threads** (`load.threads` is 5: four producers and
the consumer). What is timed is creating the channel, starting the four
threads, every send and receive with the blocking and waking they cause, and
joining the threads. CPU time is counted for the whole process, all threads
together. A channel that spins before it parks a waiting thread pays for that
in CPU time, and one that parks at once pays in system calls; both are what
the package does and both are counted. Nothing sleeps for a fixed time.

With a capacity of 1 almost every message makes a thread wait, so those
fixtures measure the hand-over between threads; with 1,024 the channel is
rarely full and they measure the queue.

Packages run with their default features and settings. Only the blocking,
thread-to-thread API is used here; the `async` send and receive of `flume`,
and the async-only channels (`async-channel`, `futures-channel`), belong to a
separate task on a single-thread executor.

Threads, as recorded with each result:

- Rust: `std::thread::scope`, four spawned threads plus the caller.
- Go: four goroutines plus the caller, with `GOMAXPROCS=5`.
- Python: `threading.Thread`. CPython and PyPy run one thread at a time under
  the interpreter lock, so the producers and the consumer take turns.
- Ruby: `Thread`, likewise one at a time under the interpreter lock.

See [shared methodology](../../README.md) for timing and reproduction.
