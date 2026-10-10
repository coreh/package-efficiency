# Brotli decompress

One operation takes a Brotli stream, decompresses it and returns the
decompressed bytes. Nothing is compressed in the timed call. Only Brotli
decoders are compared here, on the same streams, so the ranking shows how well
each one implements the format and not which format it implements. This is
the one Brotli task that a decompress-only package can enter: the other two
(`brotli-roundtrip-text`, `brotli-large-buffer-compress`) time compression.

The 47 cases decompress to 0 bytes to 72 KB (median about 6 KB, 556 KB in
all). Their contents are the category's text corpus (prose, JSON records, log
lines, CSV, source code, HTML, Unicode text, random base64 and hex, long
repeats and a mixed document, as in `brotli-large-buffer-compress`) and a
binary corpus beside it (random bytes, a little-endian `float64` sensor
series, 16-byte records and runs of palette indices), each kind at three
sizes, plus an empty stream and a one-byte one. The streams are 1 byte to
24 KB, 154 KB in all.

## The streams

The streams were made with eleven encoder settings, so the decoder meets
what different producers write and not only one encoder's defaults:
quality 0, 1, 3, 4, 5, 6, 7, 9 and 11, window sizes (`lgwin`) of 10, 16, 18,
19, 20, 22 and 24 bits, generic and text mode (each fixture's setting is in
`streams.json`). Every stream is of the standard format (RFC 7932); the
non-standard large-window extension (`lgwin` above 24) is not used, and no
custom dictionary is.

They are recorded, not made at load. `node:zlib`'s encoder is not the same
on every runtime (Deno's is the Rust `brotli` crate and writes other bytes
at the same settings), and every entry on every runtime must decode the same
bytes. `streams.bin` holds them, written once by Node.js 24.16's `node:zlib`
(the C library) with `node scenario.mjs --record`; `streams.json` holds their
lengths, settings and SHA-256. When the scenario loads it checks the hash,
regenerates the original data from fixed seeds, and checks that every
recorded stream decompresses to it. The JavaScript runner loads a copy of
`scenario.mjs` from `.cache/work/`, so the scenario looks for the two files
beside itself and then in this task's folder.

Fixtures travel as JSON, so a stream is given as a "binary string": one
character (U+0000 to U+00FF) per byte. Every adapter turns it into its
language's byte type once per fixture, in an untimed `prepare` (Node
`Buffer.from(s, 'latin1')`, Python `s.encode('latin-1')`, Go `[]byte` from
the string's runes, Rust `chars().map(|c| c as u8)`), so the timed call
starts from bytes and ends with bytes.

## What is checked

A correct output is exactly the original bytes, byte for byte, in every
fixture. JavaScript adapters return a `Uint8Array` or `Buffer`; Python, Go
and Rust adapters hand the verifier the bytes as a binary string outside the
timed call (`describe`, or Go's `MarshalJSON`; a Go `[]byte` would otherwise
marshal as base64). When the scenario loads it proves that the check refuses
the stream unchanged, output one byte short or one byte long, one bit flipped,
the last tenth missing, text decoded as UTF-8, another fixture's bytes, empty
output, a list of byte values in place of the bytes, and a JavaScript string
result.

Every package runs with its defaults as installed, in its one-shot form
(whole stream in, whole output out), with no state kept between calls beyond
what the package keeps itself. Streams are all valid, so no error path is
measured.

## Packages

| Entry | What the adapter calls |
| --- | --- |
| `builtin/node-brotli` | `zlib.brotliDecompressSync(buffer)`, a `Buffer` (Node, Bun, Deno; the C library on Node and Bun, the Rust `brotli` crate on Deno) |
| `cargo/brotli` | `brotli::BrotliDecompress(&mut &b[..], &mut out)` into a `Vec<u8>` |
| `cargo/brotli-decompressor` | `brotli_decompressor::BrotliDecompress(&mut &b[..], &mut out)` into a `Vec<u8>` |
| `gomod/andybalholm-brotli` | `io.ReadAll(brotli.NewReader(bytes.NewReader(b)))` |
| `gomod/dsnet-compress` | `io.ReadAll(brotli.NewReader(bytes.NewReader(b), nil))` from `github.com/dsnet/compress/brotli` |
| `pypi/brotli` | `brotli.decompress(b)`, `bytes` |
| `pypi/cramjam` | `cramjam.brotli.decompress(b)`, converted with `bytes(...)` inside the call as in the sibling tasks |

The `brotli` crate decompresses through `brotli-decompressor`: it depends
on it and re-exports its decoder, so the two Rust entries run the same
decoding code (at the versions each one pins) and differ only by the crate
that wraps it. Deno's `node:zlib` entry is the same Rust decoder again,
behind Deno's own bindings. `dsnet/compress` documents its Brotli package as
experimental; if it fails a stream it is recorded as not passing, with the
failing case.

The package entries are written separately; this list says what each is to
call.

## Left out

- Python, Go, Ruby and Rust standard libraries: none has a Brotli decoder,
  so the only standard-library entry is `node:zlib`.
- Decoders of the large-window extension or with a shared dictionary: outside
  the standard format these streams use.

## Scope

`brotli-large-buffer-compress` measures compression alone and
`brotli-roundtrip-text` compress plus decompress on small buffers, where the
compress leg at quality 11 dominates; this task is decompression alone, which
is what most programs do with Brotli (a browser or HTTP client reading a
response). Deflate, zlib and gzip are a separate category; archive formats
are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
