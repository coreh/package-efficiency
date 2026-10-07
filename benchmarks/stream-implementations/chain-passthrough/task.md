# Pipe chunks through a chain of passthrough streams

One operation takes `{ chunks, size, depth }` and sends `chunks` Buffers of
`size` bytes through a chain of `depth` passthrough streams (1, 3 or 8), then
returns what the tail of the chain delivered. There are 6 fixtures: 200 chunks
of 16 KiB and 2,000 chunks of 64 bytes, each at depth 1, 3 and 8.

Steps, the same in every adapter:

1. create `depth` passthrough streams of the package under test, with default
   options, and connect each to the next with the package's own `pipe`;
2. register a `data` listener on the last stream and wait for its `end`; the
   listener is the counting sink: per chunk it adds the chunk's length to
   `bytes`, adds one to `count`, and updates
   `checksum = (checksum * 131 + length + c[0] * 3 + c[length >> 1] * 5 + c[length - 1] * 7) % 2147483647`;
3. for `i` in `0..chunks`, allocate a zero-filled Buffer of `size` bytes, fill
   it with `i & 255`, then set byte 0 to `(i * 7 + 5) & 255` and the last byte
   to `(i * 13 + 1) & 255`, and write it to the first stream. When `write`
   returns exactly `false` (MuteStream returns nothing and has no backpressure), wait for the first stream's `drain` before writing the
   next chunk (backpressure is honoured);
4. call `end()` on the first stream, wait for the tail's `end`, and return
   `{ bytes, count, checksum }`.

A correct output has the exact byte and chunk counts and the checksum, which
depends on the order and content of every chunk. A stream that drops, repeats,
reorders or merges chunks fails. The result is built from what the tail
received, so an operation cannot return before the data has gone through.

The chain, the sink and the writer are created inside the measured call. No
timer or sleep is involved; the only waiting is for stream events, on the
runtime's event loop (`load.threads` is 1).

Packages: `readable-stream` (`PassThrough`), `minipass` (`Minipass`),
`mute-stream` (`MuteStream`, left unmuted), and the built-in `node:stream`
`PassThrough` as a baseline. Packages and runtimes use their defaults.

Not compared: web-streams packages (`@core/streamutil`, `@shaulov/water`,
`@fuman/io`, `@lambdalisue/workerio`), a separate job; `bl` and `split2`,
which collect or split a stream rather than pass it through. There is no
cross-language entry: Python, Ruby and Go have no stream class with the same
semantics.

See [shared methodology](../../README.md) for timing and reproduction.
