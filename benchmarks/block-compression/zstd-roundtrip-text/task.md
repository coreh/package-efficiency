# Zstandard compress and decompress text

One operation takes a string, compresses it with Zstandard, decompresses the
result and returns the restored text. Only Zstandard entries are compared
here, at the same settings. All but one bind the C library libzstd, so among
them the ranking shows the cost of each binding and its call path;
`klauspost/compress` is an implementation in Go. Entries: the Rust crates
`zstd` and `zstd-safe`, Python's `compression.zstd` (CPython 3.14 only),
`zstandard` and `cramjam`, and Go's `DataDog/zstd` (a cgo binding) and
`klauspost/compress`.

The 40 cases are 0 to 9,000 characters: prose, JSON records, log lines, CSV,
source code, HTML, Unicode text, base64 and hex data, long repeats and a few
tiny strings, the same fixtures in every format's round-trip task. The fixtures
are text so they can be shared as JSON by every language; they are encoded to
UTF-8 bytes inside the call, and decoded again afterwards.

## Settings

Every entry runs at Zstandard level 3, no dictionary, one thread, and all but `klauspost/compress` (whose default adds a checksum) without a checksum. Level 3 is the default of most of the libraries, checked in the installed sources: the `zstd` and `zstd-safe` crates are called with level 0, which libzstd defines as `ZSTD_CLEVEL_DEFAULT` (3), Python's `compression.zstd.compress` with no level uses `COMPRESSION_LEVEL_DEFAULT` (3), and `zstandard` and `cramjam` default to 3. `DataDog/zstd` defaults to 5, so its adapter passes 3; `klauspost/compress` runs at its `SpeedDefault`, about level 3, with one encoder and decoder shared across calls, as the package documents. The `zstd` crate and Python's `compression.zstd` use their library's one-shot calls, so libzstd knows the input size before it sets up its tables and both write the content size into the frame header: Python's `compress` and `decompress`, and the crate's `zstd::bulk::compress` and `zstd::bulk::decompress` (the crate documents `bulk` as its API for small blocks; its streaming `encode_all` does not tell libzstd the size and sets up full-size tables on every call). `bulk::decompress` needs an output capacity and is given the length of the input text. Each call to the crate creates and frees its own compression and decompression context. The Rust memory figure counts allocations made through Rust's allocator, which may not include the contexts libzstd allocates on the C side.

## What is checked

A correct output is exactly the input text. The compressed bytes are not
compared: implementations of one format still produce different bytes, and only
the round trip is comparable. Because a round trip alone would also accept a
function that returns its input, the check also requires the compressed size,
reported outside timing: the Rust and Python adapters' `describe` returns
`{ text, compressedBytes }`, and the Go adapters' results marshal to the same.
Each repeats the adapter's compression call once per fixture, before any
measured work. For every fixture above 300 UTF-8 bytes the compressed size must be smaller than the input. That includes the random base64 and hex ones when they are over 1,024 bytes; a shorter run of random symbols may be stored as it is, since the frame's own bytes can outweigh what entropy coding saves. Limits: the size comes from a
second, untimed call written next to the timed one, not from the timed call
itself, so it shows that the library call compresses, and review is still what
ties it to the timed code. What is timed is the round trip alone: the measured
call returns the restored text only.

## Scope

`zstd-large-buffer-compress` measures compression alone on larger buffers.
LZW is measured in its own tasks (`lzw-roundtrip-text` and `lzw-large-buffer-compress`). npm's `lz-string` is left out: it writes a format of its own that nothing else implements. Deflate, zlib and
gzip are a separate category; archive formats are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
