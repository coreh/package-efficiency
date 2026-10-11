# LZ4 compress and decompress text

One operation takes a string, compresses it with LZ4, decompresses the
result and returns the restored text. Only LZ4 implementations are
compared here, at the same settings, so the ranking shows how well each one
implements the format and not which format it implements. Entries:
the Rust crates `lz4_flex` and `lz4` (a binding of the C liblz4), `@denosaurs/lz4`
and `@nick/lz4` (WebAssembly, on Node, Bun and Deno), Python's `lz4` and
`cramjam`, and Go's `pierrec/lz4` and `cloudflare/golz4` (a cgo binding of
liblz4).

The 40 cases are 0 to 9,000 characters: prose, JSON records, log lines, CSV,
source code, HTML, Unicode text, base64 and hex data, long repeats and a few
tiny strings, the same fixtures in every format's round-trip task. The fixtures
are text so they can be shared as JSON by every language; they are encoded to
UTF-8 bytes inside the call, and decoded again afterwards.

## Settings

Every entry writes the LZ4 block format with the plain (fast) LZ4 compressor at its defaults; no adapter passes a level, an acceleration factor or any other option, and most of the packages take none. There is therefore no setting to align. One framing difference remains and is accepted: every entry but one puts the uncompressed length in front of the block as four bytes (`lz4_flex` with `compress_prepend_size`), while `@denosaurs/lz4` writes the bare block. LZ4 has no entropy coding, so random base64 and hex text does not shrink.

## What is checked

A correct output is exactly the input text. The compressed bytes are not
compared: implementations of one format still produce different bytes, and only
the round trip is comparable. Because a round trip alone would also accept a
function that returns its input, the check also requires the compressed size,
reported outside timing: JavaScript adapters attach `operation.compressedBytes(input)`, the Rust and
Python adapters' `describe` returns `{ text, compressedBytes }`, and the Go
adapters' results marshal to the same. Each repeats the adapter's compression call once per fixture, before any
measured work. For every fixture above 300 UTF-8 bytes, except the random base64 and hex ones (LZ4 has no entropy coding and cannot be relied on to shrink those), the compressed size must be smaller than the input (27 of the 40 fixtures). Limits: the size comes from a
second, untimed call written next to the timed one, not from the timed call
itself, so it shows that the library call compresses, and review is still what
ties it to the timed code. What is timed is the round trip alone: the measured
call returns the restored text only.

## Scope

`lz4-large-buffer-compress` measures compression alone on larger buffers.
LZW is measured in its own tasks (`lzw-roundtrip-text` and `lzw-large-buffer-compress`). npm's `lz-string` is left out: it writes a format of its own that nothing else implements. Deflate, zlib and
gzip are a separate category; archive formats are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
