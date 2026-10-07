# LZ4 compress large buffers

One operation takes a string of 4 KB to 214 KB (33 cases, median about 45 KB),
encodes it to UTF-8 bytes, compresses it with LZ4 and returns the
compressed bytes. Nothing is decompressed in the timed call. Only LZ4
implementations are compared here, at the same settings, so the ranking shows
how well each one implements the format and not which format it implements.
Entries: `lz4_flex` (Rust crate), `@denosaurs/lz4` and `@nick/lz4` (WebAssembly, on Node, Bun and Deno).

The UTF-8 step is not the same cost everywhere. The JavaScript adapters run
`TextEncoder.encode` on the string inside the timed call; a Rust string is
already UTF-8, so `lz4_flex` reads its bytes for free. The encode is a small
part of the JavaScript figures next to the compression itself.
`@denosaurs/lz4` is the Rust crate `lz4-compression` 0.7 compiled to
WebAssembly and optimised for size, a different and older implementation than
`lz4_flex`; it is measured as the package ships.

The fixtures are prose, JSON records, log lines, CSV, source code, HTML,
Unicode text, base64 and hex data, long repeats, and a mixed document that
interleaves text with random base64 and hex blobs, each at three sizes, the
same fixtures in every format's large-buffer task.

## Settings

All three entries write the LZ4 block format with the plain (fast) LZ4 compressor, and none of them takes a level, an acceleration factor or any other option: each package's `compress` has the input as its only argument, checked in the installed sources. There is therefore no setting to align. One framing difference remains and is accepted: `lz4_flex` (`compress_prepend_size`) and `@nick/lz4` put the uncompressed length in front of the block as four bytes, `@denosaurs/lz4` writes the bare block. LZ4 has no entropy coding, so random base64 and hex text does not shrink.

## What is checked

A correct output is a compressed byte sequence. Implementations of one format
still produce different bytes, so outputs are not compared with each other.
Instead the verifier, outside timing, decompresses each adapter's own output
with the same library and requires the exact input text back, and checks the
size: every fixture except the random base64 and hex ones must compress to
under 90% of its size, the random ones must not compress below 40% (a result
that small could not restore the text), and sizes must differ between fixtures.
This fails an adapter that returns its input, a constant, or skips the work.
JavaScript adapters attach `operation.decode(compressed)`; the Rust adapter's `describe` decompresses.

## Scope

`lz4-roundtrip-text` measures small buffers (under 9,000 characters) through
compress plus decompress, where per-call setup matters; this task measures
compression throughput alone on larger buffers, so the ranking reflects the
encoder's speed and memory use, not the decoder or fixed per-call cost.
LZW is measured in its own tasks (`lzw-roundtrip-text` and `lzw-large-buffer-compress`). npm's `lz-string` is left out: it writes a format of its own that nothing else implements. Deflate, zlib and
gzip are a separate category; archive formats are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
