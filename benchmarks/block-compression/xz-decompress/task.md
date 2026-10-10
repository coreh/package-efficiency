# xz decompress

One operation takes an .xz stream, decompresses it and returns the
decompressed bytes. Nothing is compressed in the timed call. Only xz decoders
are compared here, on the same streams, so the ranking shows how well each
one implements the format and not which format it implements. A
decompress-only implementation can enter, which is why `github.com/xi2/xz`, a
decoder only, has an entry.

The 49 cases decompress to 0 bytes to 323 KB (median about 6.5 KB, 1.1 MB in
all). Their contents are the category's text corpus (prose, JSON records, log
lines, CSV, source code, HTML, Unicode text, random base64 and hex, long
repeats and a mixed document, as in `bzip2-large-buffer-compress`) and a
binary corpus beside it (random bytes, a little-endian `float64` sensor
series, 16-byte records and runs of palette indices), each kind at three
sizes, the same 45 inputs as `brotli-decompress` and `bzip2-decompress`.
Beside them are two inputs longer than one block, so the decoder also goes
from block to block inside one stream (about 320 KB of prose and JSON at
preset 6 in 100 KiB blocks, four blocks; about 250 KB of mixed content at
preset 3 in 64 KiB blocks, four blocks), an empty stream and a one-byte one.
The streams are 32 bytes to 74 KB (median about 1.2 KB), 270 KB in all.

## The streams

Each stream is one ordinary .xz stream: stream header, LZMA2 blocks, index,
footer, nothing before or after. The streams use every preset, 1 to 9 (fast
mode with a hash-chain match finder at 1 to 3, normal mode with a binary-tree
one at 4 to 9), and both common integrity checks: CRC64, xz's default, on
the even-numbered fixtures and CRC32 on the odd ones (each fixture's preset,
check and block size are in `streams.json`). So each kind of data is met at
three different presets.

What was narrowed, for fairness:

- **The dictionary is sized to the input.** Each stream's LZMA2 dictionary is
  the smallest power of two that holds its input (4 KiB at least, 512 KiB at
  most here), not the preset's own (1 MiB at preset 1 up to 64 MiB at
  preset 9). A decoder sizes its buffer from the size written in the stream,
  and with the presets' sizes a one-shot decode of a 2 KB stream would be
  timed allocating, and in Go zeroing, up to 64 MiB; the ranking would be of
  allocation strategies. The rest of each preset (mode, match finder, nice
  length, depth) is kept. A dictionary larger than the input is what the xz
  manual calls a waste of memory; `xz -lvv` shows each stream's.
- **LZMA2 is the only filter.** No BCJ or delta filters, which
  `github.com/ulikunitz/xz` does not read.
- **CRC64 and CRC32 checks only.** No SHA-256 and no "none", which a decoder
  may skip or not verify; every entry here verifies the check it reads.
- **One stream per fixture.** No concatenated streams and no stream padding,
  which not every one-shot call reads past in the same way.

They are recorded, not made at load: no JavaScript runtime has an xz encoder.
`streams.bin` holds them, written once by the `xz` 5.8.4 command (XZ Utils,
liblzma, the reference implementation) with `node scenario.mjs --record`, one
`xz -c -T1 --format=xz --check=<check> --lzma2=preset=<n>,dict=<size>` (with
`--block-size` for the two long inputs) per fixture, each decompressed again
by `xz -dc --single-stream` and compared with its input before it was kept.
`streams.json` holds their lengths and settings and their SHA-256, and the
SHA-256 of the original data. The expected output of each fixture is that
original data, regenerated from fixed seeds when the scenario loads, never a
decoder's output. At load the scenario checks both hashes (so a change to the
generators is caught), and reads each stream's structure: the header and
footer magic and the check in both, no second stream header inside it, the
index found from the footer with the expected number of blocks and their
sizes adding up to the input's, and each block's header naming LZMA2 alone
with the expected dictionary size. The JavaScript runner loads a copy of
`scenario.mjs` from `.cache/work/`, so the scenario looks for the two files
beside itself and then in this task's folder.

Fixtures travel as JSON, so a stream is given as a "binary string": one
character (U+0000 to U+00FF) per byte. Every adapter turns it into its
language's byte type once per fixture, in an untimed `prepare` (Python
`s.encode('latin-1')`, Go `[]byte` from the string's runes, Rust
`chars().map(|c| c as u8)`), so the timed call starts from bytes and ends
with bytes.

## What is checked

A correct output is exactly the original bytes, byte for byte, in every
fixture. Python, Go and Rust adapters hand the verifier the bytes as a binary
string outside the timed call (`describe`, or Go's `MarshalJSON`; a Go
`[]byte` would otherwise marshal as base64); a JavaScript adapter would
return a `Uint8Array` or `Buffer`. When the scenario loads it proves that the
check refuses the stream unchanged, output one byte short or one byte long,
one bit flipped, the last tenth missing, text decoded as UTF-8, another
fixture's bytes, empty output, a list of byte values in place of the bytes,
and a JavaScript string result.

Every package runs with its defaults as installed, in its one-shot form
(whole stream in, whole output out), with no state kept between calls beyond
what the package keeps itself. Streams are all valid, so no error path is
measured.

## Packages

| Entry | What the adapter calls |
| --- | --- |
| `builtin/python-lzma` | `lzma.decompress(b)`, `bytes` (liblzma on CPython and PyPy) |
| `gomod/ulikunitz-xz` | `io.ReadAll(r)` with `r, _ := xz.NewReader(bytes.NewReader(b))` from `github.com/ulikunitz/xz`, a codec written in Go |
| `gomod/xi2-xz` | `io.ReadAll(r)` with `r, _ := xz.NewReader(bytes.NewReader(b), 0)` from `github.com/xi2/xz`, a decoder only (a Go port of XZ Embedded); `0` is its default dictionary limit |
| `pypi/cramjam` | `cramjam.xz.decompress(b)`, converted with `bytes(...)` inside the call as in the sibling tasks |

The package entries are written separately; this list says what each is to
call.

## Left out

- Node, Bun and Deno: no xz or LZMA in any of their standard libraries, so
  there is no JavaScript standard-library entry.
- Go, Ruby and Rust standard libraries: none of them has xz.
- Raw LZMA1 (`.lzma`) and raw LZMA2 streams: another container, which not
  every entry here reads; this task is the `.xz` format only.

## Scope

This task is decompression alone, which is what most programs do with xz
(reading a `.xz` file, a `.tar.xz` member or a package archive). A roundtrip
task would take `ulikunitz/xz`, Python's `lzma` and `cramjam` but not
`xi2/xz`, which cannot compress. Deflate, zlib and gzip are a separate
category; archive formats are out of scope. See
[shared methodology](../../README.md) for timing and reproduction.
