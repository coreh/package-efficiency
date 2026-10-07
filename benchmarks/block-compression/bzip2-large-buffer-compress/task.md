# bzip2 compress large buffers

One operation takes a string of 4 KB to 214 KB (33 cases, median about 45 KB),
encodes it to UTF-8 bytes, compresses it with bzip2 and returns the
compressed bytes. Nothing is decompressed in the timed call. Only bzip2
implementations are compared here, at the same settings, so the ranking shows
how well each one implements the format and not which format it implements.
Entries: `bzip2` (Rust crate) and Python's `bz2` (CPython and PyPy).

The fixtures are prose, JSON records, log lines, CSV, source code, HTML,
Unicode text, base64 and hex data, long repeats, and a mixed document that
interleaves text with random base64 and hex blobs, each at three sizes, the
same fixtures in every format's large-buffer task.

## Settings

Every entry runs at bzip2 level 9 (900 KB blocks), passed explicitly by both adapters. The libraries' defaults differ, checked in the installed sources: `bzip2::Compression::default()` is level 6, and Python's `bz2.compress` has `compresslevel=9` on CPython and on PyPy. This project's variant mechanism (a second entry of the same package with a different setting) exists only for JavaScript adapters in this kind of task; Rust and Python adapters cannot have one. So instead of each package's default plus a variant at the other's level, both entries are set to one level: 9, which is Python's default and the `bzip2` command's. For the `bzip2` crate that is not its default, and its entry is tagged as running with non-default options. The level is the block size, so on inputs smaller than 100 KB it changes memory use more than output.

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

`bzip2-roundtrip-text` measures small buffers (under 9,000 characters) through
compress plus decompress, where per-call setup matters; this task measures
compression throughput alone on larger buffers, so the ranking reflects the
encoder's speed and memory use, not the decoder or fixed per-call cost.
LZW is measured in its own tasks (`lzw-roundtrip-text` and `lzw-large-buffer-compress`). npm's `lz-string` is left out: it writes a format of its own that nothing else implements. Deflate, zlib and
gzip are a separate category; archive formats are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
