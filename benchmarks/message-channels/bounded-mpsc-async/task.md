# Send from four async tasks to one through a bounded channel

One operation creates a bounded channel of capacity C (16, 64 or 1,024),
starts four producer tasks, and receives in the operation's own task, all on
one thread. Producer `p` (0 to 3) sends the M integers `i * 4 + p` for `i`
from 0 to M - 1 (M is 250, 1,000 or 4,000), awaiting its send whenever the
channel is full. The consumer receives exactly 4 × M messages, awaiting
whenever the channel is empty, then waits for the producers to finish. There
are 9 fixtures, one per pair of M and C. This is the single-thread
counterpart of `bounded-mpsc-threads`, with the same messages and the same
check.

The units of work are the same in every adapter and do nothing of their own:

1. a producer sends its M integers one after another, awaiting each send, and
   ends;
2. the consumer awaits one receive at a time. For every message `v` it works
   out its producer (`v % 4`) and its position (`v / 4`, rounded down),
   notes whether it is the next one expected from that producer, and adds `v`
   to a sum;
3. after the 4 × M-th message the consumer waits for the four producers and
   returns `{ count, sum, ordered }`.

No unit yields other than by awaiting the channel. A correct output has
`count` equal to 4 × M, `sum` equal to the sum of all the integers from 0 to
4 × M - 1 (so nothing was lost or delivered twice) and `ordered` true (so the
channel kept each sender's order). The check is exact; nothing is forgiven.
The result exists only once every message has been received, so an
operation cannot return early.

This is an asynchronous task on **one thread** (`load.threads` is 1): the
producers and the consumer interleave, they never run in parallel. Each
operation is one awaited call (in Go, one call that blocks). What is timed is
creating the channel, starting the four producers, every send and receive
with the suspending and waking they cause, and waiting for the producers.
The channel and the producers are created inside the measured call in every
adapter, so their start-up is part of the figure; with 1,000 to 16,000
messages per operation it is a small part. With a capacity of 16 the
producers are suspended often and the fixtures measure the hand-over between
tasks; with 1,024 the channel is rarely full and they measure the queue. No
timer or sleep with a real delay is involved anywhere.

The capacity is the one given to the channel's constructor, with one
exception: `futures-channel`'s `mpsc::channel(buffer)` holds `buffer` plus
one slot for each sender, so its adapter clones one sender per producer,
drops the original, and passes `buffer = C - 4`, which makes its capacity
exactly C. Every capacity is at least 4 so that this is possible. Packages
otherwise run with their default features and settings.

Executors, as recorded with each result:

- JavaScript: the runtime's own event loop; producers are async functions
  started without awaiting, and the consumer awaits them with `Promise.all`
  at the end.
- Python: one `asyncio` event loop for the whole run; producers are tasks
  (`asyncio.create_task`, or for `anyio` a task group's `start_soon` on the
  same loop).
- Go: goroutines with `GOMAXPROCS=1`; the calling goroutine is the consumer.
- Rust: the four producers and the consumer are futures of one task, joined
  in the operation's future (`futures::future::join_all` for the producers,
  joined with the consumer), not spawned tasks. Crates that work on any
  executor (`futures-channel`, `futures-intrusive`, `async-channel`,
  `flume`) run on `futures::executor::block_on`; `tokio` runs the same join
  inside `block_on` of a current-thread runtime.

Packages and what each adapter calls:

- `@blowater/csp` (JSR): `chan(C)`, `await c.put(v)` and `await c.pop()`.
- `futures-channel` (crates.io): `mpsc::channel(C - 4)`, `SinkExt::send` and
  `StreamExt::next`, with one cloned `Sender` per producer.
- `futures-intrusive` (crates.io): a `LocalChannel` (single-thread) with a
  buffer of capacity C, `send(v).await` and `receive().await`.
- `async-channel` (crates.io): `bounded(C)`, `send(v).await` and
  `recv().await`.
- `flume` (crates.io): `bounded(C)`, `send_async(v).await` and
  `recv_async().await`.
- `tokio` (crates.io): `sync::mpsc::channel(C)`, `send(v).await` and
  `recv().await`.
- `anyio` (PyPI): `create_memory_object_stream(C)`, `await send(v)` and
  `await receive()`; its send and receive also pass through one cancellation
  checkpoint each, which is what the package does and is counted.
- Python `asyncio.Queue(C)` (built-in): `await put(v)` and `await get()`.
- Go `make(chan uint64, C)` (built-in): `channel <- v` and `<-channel`.

## Left out

- `futures` (crates.io): its `channel::mpsc` is `futures-channel`
  re-exported; that crate, which does the work, is the entry.
- Ruby: no event loop in the standard library; `Thread::SizedQueue` between
  threads is in `bounded-mpsc-threads`.
- Channels used only through a blocking, thread-to-thread API
  (`crossbeam-channel`, `std::sync::mpsc`, Python `queue.Queue`) belong to
  `bounded-mpsc-threads`.
- JavaScript has no channel in its standard library, so there is no built-in
  JavaScript entry, and one is not written by hand.

See [shared methodology](../../README.md) for timing and reproduction.
