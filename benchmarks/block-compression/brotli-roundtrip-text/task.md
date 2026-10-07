# Brotli compress and decompress text

One operation takes a string, compresses it with Brotli, decompresses the
result and returns the restored text. Only Brotli implementations are
compared here, at the same settings, so the ranking shows how well each one
implements the format and not which format it implements. Entries:
`brotli` (Rust crate) and `node:zlib`'s Brotli (Node, Bun, Deno).

The 40 cases are 0 to 9,000 characters: prose, JSON records, log lines, CSV,
source code, HTML, Unicode text, base64 and hex data, long repeats and a few
tiny strings, the same fixtures in every format's round-trip task. The fixtures
are text so they can be shared as JSON by every language; they are encoded to
UTF-8 bytes inside the call, and decoded again afterwards.

## Settings

Every entry runs at Brotli quality 11 with a 22-bit window (`lgwin` 22), generic mode, no size hint and no dictionary. That is the default of both libraries, checked in the installed sources: `node:zlib` (`BROTLI_DEFAULT_QUALITY` 11, `BROTLI_DEFAULT_WINDOW` 22) and the `brotli` crate (`BrotliEncoderParams::default()`: `quality: 11`, `lgwin: 22`), so both run as installed and no setting is passed. `node:zlib` is a different encoder on each runtime (Node and Bun link the C library, Deno the Rust `brotli` crate, version 6 in Deno 2.9.6 by its source, called through the crate's C-compatible interface; the crate entry here is version 9, so on Deno the two entries are two versions of the same encoder); on all three the no-options output is byte-identical to the output with quality 11 and window 22 passed explicitly.

## What is checked

A correct output is exactly the input text. The compressed bytes are not
compared: implementations of one format still produce different bytes, and only
the round trip is comparable. Because a round trip alone would also accept a
function that returns its input, the check also requires the compressed size,
reported outside timing: the JavaScript adapter attaches `operation.compressedBytes(input)`, and the Rust adapter's `describe` returns `{ text, compressedBytes }`.
Both repeat the adapter's compression call once per fixture, before any
measured work. For every fixture above 300 UTF-8 bytes the compressed size must be smaller than the input, the random base64 and hex ones included (31 of the 40 fixtures). Limits: the size comes from a
second, untimed call written next to the timed one, not from the timed call
itself, so it shows that the library call compresses, and review is still what
ties it to the timed code. What is timed is the round trip alone: the measured
call returns the restored text only.

## Scope

`brotli-large-buffer-compress` measures compression alone on larger buffers.
At quality 11 compressing costs far more than decompressing, so this task's
figures are mostly the compress leg on small inputs and say little about
decompression speed; the two tasks are expected to order the entries the same way.
LZW is measured in its own tasks (`lzw-roundtrip-text` and `lzw-large-buffer-compress`). npm's `lz-string` is left out: it writes a format of its own that nothing else implements. Deflate, zlib and
gzip are a separate category; archive formats are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
