# bzip2 compress and decompress text

One operation takes a string, compresses it with bzip2, decompresses the
result and returns the restored text. Only bzip2 implementations are
compared here, at the same settings, so the ranking shows how well each one
implements the format and not which format it implements. Entries:
`bzip2` (Rust crate) and Python's `bz2` (CPython and PyPy).

The 40 cases are 0 to 9,000 characters: prose, JSON records, log lines, CSV,
source code, HTML, Unicode text, base64 and hex data, long repeats and a few
tiny strings, the same fixtures in every format's round-trip task. The fixtures
are text so they can be shared as JSON by every language; they are encoded to
UTF-8 bytes inside the call, and decoded again afterwards.

## Settings

Every entry runs at bzip2 level 9 (900 KB blocks), passed explicitly by both adapters. The libraries' defaults differ, checked in the installed sources: `bzip2::Compression::default()` is level 6, and Python's `bz2.compress` has `compresslevel=9` on CPython and on PyPy. This project's variant mechanism (a second entry of the same package with a different setting) exists only for JavaScript adapters in this kind of task; Rust and Python adapters cannot have one. So instead of each package's default plus a variant at the other's level, both entries are set to one level: 9, which is Python's default and the `bzip2` command's. For the `bzip2` crate that is not its default, and its entry is tagged as running with non-default options. The level is the block size, so on inputs smaller than 100 KB it changes memory use more than output. That matters for what the figure means: the inputs here are at most 9,000 characters, but at level 9 every call sets up the compressor's work arrays for a 900 KB block (several megabytes) and the decompressor's for the block size written in the stream. Both entries pay this in every call, so the comparison is even, but a large part of the cost is allocating and releasing that memory, not compressing the text. Only two entries are compared.

## What is checked

A correct output is exactly the input text. The compressed bytes are not
compared: implementations of one format still produce different bytes, and only
the round trip is comparable. Because a round trip alone would also accept a
function that returns its input, the check also requires the compressed size,
reported outside timing: the Rust and Python adapters' `describe` returns `{ text, compressedBytes }`.
It repeats the adapter's compression call once per fixture, before any
measured work. For every fixture above 300 UTF-8 bytes the compressed size must be smaller than the input, the random base64 and hex ones included (31 of the 40 fixtures). Limits: the size comes from a
second, untimed call written next to the timed one, not from the timed call
itself, so it shows that the library call compresses, and review is still what
ties it to the timed code. What is timed is the round trip alone: the measured
call returns the restored text only.

## Scope

`bzip2-large-buffer-compress` measures compression alone on larger buffers.
LZW is measured in its own tasks (`lzw-roundtrip-text` and `lzw-large-buffer-compress`). npm's `lz-string` is left out: it writes a format of its own that nothing else implements. Deflate, zlib and
gzip are a separate category; archive formats are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
