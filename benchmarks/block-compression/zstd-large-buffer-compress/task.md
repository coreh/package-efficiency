# Zstandard compress large buffers

One operation takes a string of 4 KB to 214 KB (33 cases, median about 45 KB),
encodes it to UTF-8 bytes, compresses it with Zstandard and returns the
compressed bytes. Nothing is decompressed in the timed call. Only Zstandard
entries are compared here, at the same settings. Both bind the same C library,
libzstd 1.5.7, so the ranking shows the cost of each binding and its call path
around that library (and the language around it), not two implementations of
the format.
Entries: `zstd` (Rust crate) and Python's `compression.zstd` (CPython 3.14 only).

The fixtures are prose, JSON records, log lines, CSV, source code, HTML,
Unicode text, base64 and hex data, long repeats, and a mixed document that
interleaves text with random base64 and hex blobs, each at three sizes, the
same fixtures in every format's large-buffer task.

## Settings

Every entry runs at Zstandard level 3, no dictionary, no checksum, one thread. That is the default of both libraries, checked in the installed sources: the `zstd` crate is called with level 0, which libzstd defines as `ZSTD_CLEVEL_DEFAULT` (3), and Python's `compression.zstd.compress` with no level uses `COMPRESSION_LEVEL_DEFAULT` (3); both bind libzstd 1.5.7. Both entries use their library's one-shot compression call, so libzstd knows the input size before it sets up its tables and both write the content size into the frame header: Python's `compress`, and the crate's `zstd::bulk::compress` (its streaming `encode_all` does not tell libzstd the size and sets up full-size tables on every call). Each call to the crate creates and frees its own compression context. The Rust memory figure counts allocations made through Rust's allocator, which may not include the context libzstd allocates on the C side.

## What is checked

A correct output is a compressed byte sequence. Implementations of one format
still produce different bytes, so outputs are not compared with each other.
Instead the verifier, outside timing, decompresses each adapter's own output
with the same library and requires the exact input text back, and checks the
size: every fixture except the random base64 and hex ones must compress to
under 90% of its size, the random ones must not compress below 40% (a result
that small could not restore the text), and sizes must differ between fixtures.
This fails an adapter that returns its input, a constant, or skips the work.
The Rust and Python adapters' `describe` decompresses.

## Scope

`zstd-roundtrip-text` measures small buffers (under 9,000 characters) through
compress plus decompress, where per-call setup matters; this task measures
compression throughput alone on larger buffers, so the ranking reflects the
encoder's speed and memory use, not the decoder or fixed per-call cost.
LZW is measured in its own tasks (`lzw-roundtrip-text` and `lzw-large-buffer-compress`). npm's `lz-string` is left out: it writes a format of its own that nothing else implements. Deflate, zlib and
gzip are a separate category; archive formats are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
