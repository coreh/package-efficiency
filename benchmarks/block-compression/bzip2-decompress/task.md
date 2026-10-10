# bzip2 decompress

One operation takes a bzip2 stream, decompresses it and returns the
decompressed bytes. Nothing is compressed in the timed call. Only bzip2
decoders are compared here, on the same streams, so the ranking shows how well
each one implements the format and not which format it implements. This is
the one bzip2 task that a decompress-only implementation can enter: the other
two (`bzip2-roundtrip-text`, `bzip2-large-buffer-compress`) time compression,
which is why Go's `compress/bzip2`, a decoder only, has an entry here and in
neither of them.

The 49 cases decompress to 0 bytes to 323 KB (median about 6.5 KB, 1.1 MB in
all). Their contents are the category's text corpus (prose, JSON records, log
lines, CSV, source code, HTML, Unicode text, random base64 and hex, long
repeats and a mixed document, as in `bzip2-large-buffer-compress`) and a
binary corpus beside it (random bytes, a little-endian `float64` sensor
series, 16-byte records and runs of palette indices), each kind at three
sizes, the same 45 inputs as `brotli-decompress`. Beside them are two inputs
longer than one block, so the decoder also goes from block to block inside
one stream (about 320 KB of prose and JSON at level 1, four 100 KB blocks;
about 250 KB of mixed content at level 2, two 200 KB blocks), an empty
stream and a one-byte one. The streams are 14 bytes to 70 KB, 260 KB in all.

## The streams

The level of bzip2 is its block size (1 to 9 is 100 to 900 KB), written in
the stream's header; the decoder sizes its buffers from it. The streams use
every level, 1 to 9 (each fixture's level is in `streams.json`), so each kind
of data is met at three different levels. Each is one ordinary bzip2 stream:
no concatenated streams (which not every decoder's one-shot call reads past),
no randomised blocks (a deprecated flag that no current encoder writes).

They are recorded, not made at load: no JavaScript runtime has a bzip2
encoder. `streams.bin` holds them, written once by the `bzip2` 1.0.8 command
(libbzip2, the reference implementation) with `node scenario.mjs --record`,
one `bzip2 -c -<level>` per fixture, each decompressed again by `bzip2 -dc`
and compared with its input before it was kept. `streams.json` holds their
lengths, levels and SHA-256, and the SHA-256 of the original data. The
expected output of each fixture is that original data, regenerated from fixed
seeds when the scenario loads, never a decoder's output. At load the scenario
checks both hashes (so a change to the generators is caught), and that each
stream starts with `BZh` and its level, followed by the first block's magic
number (or the end-of-stream one for empty data), with no second stream
header inside it. The JavaScript runner loads a copy of `scenario.mjs` from
`.cache/work/`, so the scenario looks for the two files beside itself and
then in this task's folder.

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
| `builtin/python-bz2` | `bz2.decompress(b)`, `bytes` (libbzip2 on CPython and PyPy) |
| `builtin/go-bzip2` | `io.ReadAll(bzip2.NewReader(bytes.NewReader(b)))` from `compress/bzip2`, a decoder written in Go |
| `cargo/bzip2` | `bzip2::read::BzDecoder::new(&b[..]).read_to_end(&mut out)` into a `Vec<u8>` |
| `gomod/dsnet-compress` | `io.ReadAll(r)` with `r, _ := bzip2.NewReader(bytes.NewReader(b), nil)` from `github.com/dsnet/compress/bzip2` |
| `pypi/cramjam` | `cramjam.bzip2.decompress(b)`, converted with `bytes(...)` inside the call as in the sibling tasks |

`dsnet/compress` counts once in the project although it also has an entry in
`brotli-decompress`; here it runs its bzip2 package. The `bzip2` crate is
used with its default features, as in the sibling tasks (from 0.6 its
default backend is `libbz2-rs-sys`, a Rust port of libbzip2, not the C
library).

The package entries are written separately; this list says what each is to
call.

## Left out

- Node, Bun and Deno: no bzip2 in any of their standard libraries, so there
  is no JavaScript standard-library entry.
- Ruby and Rust standard libraries: neither has bzip2.
- Decoders of concatenated streams only (`MultiBzDecoder` and the like) as a
  separate entry: every stream here is a single one, so they would measure
  the same decoder.

## Scope

`bzip2-large-buffer-compress` measures compression alone and
`bzip2-roundtrip-text` compress plus decompress on small buffers, where the
compress leg dominates; this task is decompression alone, which is what most
programs do with bzip2 (reading a `.bz2` file or an archive member). Deflate,
zlib and gzip are a separate category; archive formats are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
