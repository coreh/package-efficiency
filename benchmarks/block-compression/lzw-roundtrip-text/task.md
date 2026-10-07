# LZW compress and decompress text

One operation takes a string, compresses it with LZW, decompresses the
result and returns the restored text. Only LZW implementations are
compared here, at the same settings, so the ranking shows how well each one
implements the format and not which format it implements. Entries:
`compress/lzw` (Go standard library) and `weezl` (Rust crate).

The 40 cases are 0 to 9,000 characters: prose, JSON records, log lines, CSV,
source code, HTML, Unicode text, base64 and hex data, long repeats and a few
tiny strings, the same fixtures in every format's round-trip task. The fixtures
are text so they can be shared as JSON by every language; they are encoded to
UTF-8 bytes inside the call, and decoded again afterwards. That costs Go a copy
each way and Rust one validation pass on the way out.

## Settings

LZW comes in variants that cannot read each other's output: the bit order and the width of a literal are parameters of the format. Both entries use the variant GIF and PDF use, least significant bit first with 8-bit literals: `lzw.NewWriter(w, lzw.LSB, 8)` in Go and `Encoder::new(BitOrder::Lsb, 8)` in `weezl`. Codes grow from 9 to 12 bits and the table is cleared when it fills, in both. Neither has a compression level or any other option. Each call makes a new encoder, which is how both are used for a single buffer. Go's writes through an `io.Writer` into a `bytes.Buffer`, since the package has no one-call form; `weezl` uses its one-call `encode`. Random base64 and hex text shrinks little under LZW.

## What is checked

A correct output is exactly the input text. Because a round trip alone would
also accept a function that returns its input, the check also requires the
compressed size, reported outside timing: the Go adapter's result marshals to
`{ text, compressedBytes }` and the Rust adapter's `describe` returns the same.
Both repeat the adapter's compression call once per fixture, before any
measured work. For every fixture above 300 UTF-8 bytes, except the random
base64 and hex ones, the compressed size must be smaller than the input (27 of
the 40 fixtures). Limits: the size comes from a second, untimed call written
next to the timed one, not from the timed call itself, so it shows that the
library call compresses, and review is still what ties it to the timed code.
What is timed is the round trip alone.

## Scope

`lzw-large-buffer-compress` measures compression alone on larger buffers.
Two entries is a thin comparison, and they are in different languages, so the
ranking also reflects Go against Rust. No LZW package with an adapter exists
here for the other languages. npm's `lz-string` is left out: it writes a format
of its own that nothing else implements. Deflate, zlib and gzip are a separate
category; archive formats are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
