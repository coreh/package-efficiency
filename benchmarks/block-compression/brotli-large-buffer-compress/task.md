# Brotli compress large buffers

One operation takes a string of 4 KB to 214 KB (33 cases, median about 45 KB),
encodes it to UTF-8 bytes, compresses it with Brotli and returns the
compressed bytes. Nothing is decompressed in the timed call. Only Brotli
implementations are compared here, at the same settings, so the ranking shows
how well each one implements the format and not which format it implements.
Entries: `brotli` (Rust crate) and `node:zlib`'s Brotli (Node, Bun, Deno).

The fixtures are prose, JSON records, log lines, CSV, source code, HTML,
Unicode text, base64 and hex data, long repeats, and a mixed document that
interleaves text with random base64 and hex blobs, each at three sizes, the
same fixtures in every format's large-buffer task.

## Settings

Every entry runs at Brotli quality 11 with a 22-bit window (`lgwin` 22), generic mode, no size hint and no dictionary. That is the default of both libraries, checked in the installed sources: `node:zlib` (`BROTLI_DEFAULT_QUALITY` 11, `BROTLI_DEFAULT_WINDOW` 22) and the `brotli` crate (`BrotliEncoderParams::default()`: `quality: 11`, `lgwin: 22`), so both run as installed and no setting is passed. `node:zlib` is a different encoder on each runtime (Node and Bun link the C library, Deno the Rust `brotli` crate, version 6 in Deno 2.9.6 by its source, called through the crate's C-compatible interface; the crate entry here is version 9, so on Deno the two entries are two versions of the same encoder); on all three the no-options output is byte-identical to the output with quality 11 and window 22 passed explicitly.

## What is checked

A correct output is a compressed byte sequence. Implementations of one format
still produce different bytes, so outputs are not compared with each other.
Instead the verifier, outside timing, decompresses each adapter's own output
with the same library and requires the exact input text back, and checks the
size: every fixture except the random base64 and hex ones must compress to
under 90% of its size, the random ones must not compress below 40% (a result
that small could not restore the text), and sizes must differ between fixtures.
This fails an adapter that returns its input, a constant, or skips the work.
The JavaScript adapter attaches `operation.decode(compressed)`; the Rust adapter's `describe` decompresses.

## Scope

`brotli-roundtrip-text` measures small buffers (under 9,000 characters) through
compress plus decompress, where per-call setup matters; this task measures
compression throughput alone on larger buffers, so the ranking reflects the
encoder's speed and memory use, not the decoder or fixed per-call cost.
LZW is measured in its own tasks (`lzw-roundtrip-text` and `lzw-large-buffer-compress`). npm's `lz-string` is left out: it writes a format of its own that nothing else implements. Deflate, zlib and
gzip are a separate category; archive formats are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
