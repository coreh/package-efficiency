# LZW compress large buffers

One operation takes a string of 4 KB to 214 KB (33 cases, median about 45 KB),
encodes it to UTF-8 bytes, compresses it with LZW and returns the
compressed bytes. Nothing is decompressed in the timed call. Only LZW
implementations are compared here, at the same settings, so the ranking shows
how well each one implements the format and not which format it implements.
Entries: `compress/lzw` (Go standard library) and `weezl` (Rust crate).

The fixtures are prose, JSON records, log lines, CSV, source code, HTML,
Unicode text, base64 and hex data, long repeats, and a mixed document that
interleaves text with random base64 and hex blobs, each at three sizes, the
same fixtures in every format's large-buffer task.

## Settings

LZW comes in variants that cannot read each other's output: the bit order and the width of a literal are parameters of the format. Both entries use the variant GIF and PDF use, least significant bit first with 8-bit literals: `lzw.NewWriter(w, lzw.LSB, 8)` in Go and `Encoder::new(BitOrder::Lsb, 8)` in `weezl`. Codes grow from 9 to 12 bits and the table is cleared when it fills, in both. Neither has a compression level or any other option. Each call makes a new encoder, which is how both are used for a single buffer. Go's writes through an `io.Writer` into a `bytes.Buffer`, since the package has no one-call form; `weezl` uses its one-call `encode`. Random base64 and hex text shrinks little under LZW.

## What is checked

A correct output is a compressed byte sequence. The verifier, outside timing,
decompresses each adapter's own output with the same library and requires the
exact input text back, and checks the size: every fixture except the random
base64 and hex ones must compress to under 90% of its size, the random ones
must not compress below 40% (a result that small could not restore the text),
and sizes must differ between fixtures. This fails an adapter that returns its
input, a constant, or skips the work. The Go adapter's result decompresses
itself when the runner marshals it, once per fixture before any measured work;
the Rust adapter's `describe` does the same.

## Scope

`lzw-roundtrip-text` measures a compress-then-decompress round trip on small
text. Two entries is a thin comparison, and they are in different languages,
so the ranking also reflects Go against Rust. npm's `lz-string` is left out:
it writes a format of its own that nothing else implements. Deflate, zlib and
gzip are a separate category; archive formats are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
