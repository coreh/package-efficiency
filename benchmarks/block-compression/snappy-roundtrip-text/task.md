# Snappy compress and decompress text

One operation takes a string, compresses it to the raw Snappy block format,
decompresses that block and returns both: the compressed block and the
restored text. Only Snappy implementations are compared here, so the ranking
shows how well each one implements the format and not which format it
implements. Entries, each calling its package's one-shot block functions:

- `snap` (Rust crate): `snap::raw::Encoder::new().compress_vec` and `snap::raw::Decoder::new().decompress_vec`.
- `github.com/golang/snappy` (Go): `snappy.Encode(nil, src)` and `snappy.Decode(nil, enc)`.
- `github.com/btcsuite/snappy-go` (Go): `snappy.Encode(nil, src)` and `snappy.Decode(nil, enc)`. An old fork of `golang/snappy`, measured as it is.
- `cramjam` (PyPI): `cramjam.snappy.compress_raw` and `cramjam.snappy.decompress_raw`.

No standard library of the harness's languages (Node, Bun, Deno, Python,
Ruby, Go) implements Snappy, so there is no `builtin` entry.

The 40 cases are 0 to 9,000 characters (0 to 8,978 UTF-8 bytes): prose, JSON
records, log lines, CSV, source code, HTML, Unicode text, base64 and hex data,
long repeats and a few tiny strings, the same fixtures in every format's
round-trip task. The fixtures are text so they can be shared as JSON by every
language; they are encoded to UTF-8 bytes inside the call, and the restored
bytes are decoded to text inside the call too.

## Settings

Snappy has no level, window or other option: every entry's encoder takes the
input as its only argument, and the raw format has no header besides the
uncompressed length as a varint. There is therefore no setting to align. The
encoders still choose matches differently, so the compressed bytes differ
between entries and are not compared with each other.

## What is checked

An output is `{ compressed, text }`. The text must be exactly the input,
code point for code point. The compressed block is the one the timed call
produced (not a second, untimed call), and the verifier, outside timing,
decodes it with the scenario's own Snappy decoder, written from the format
description (`format_description.txt` of google/snappy): the varint length,
literals with their length in the tag or in one to four extra bytes, and the
three kinds of copy. The decoder is strict: a copy offset of 0 or past what
has been written, an element that runs past the declared length or the end
of the block, trailing bytes, or fewer bytes than declared all fail. The
decoded bytes must equal the input's UTF-8 bytes. So a function that returns
its input, a private format, a block with a 4-byte length prefix in place of
the varint, or the framing format (`sNaPpY` chunks) fails. The block must
also fit Snappy's own bound (32 + n + n/6 bytes), and for every fixture above
300 UTF-8 bytes except the random base64 and hex ones it must be smaller than
the input (27 of the 40 fixtures): Snappy has no entropy coding, so as in
the LZ4 task random symbols need not shrink, and a block of literals alone,
which is valid Snappy, passes only where nothing has to shrink. The decoder
is checked against hand-written streams of each element kind when the
scenario loads, and the scenario asserts there that malformed streams, the
input bytes, another fixture's block, a length-prefixed block and a wrong
text are refused.

What crosses to the verifier: a JavaScript adapter returns the block as a
`Uint8Array`; Rust, Go and Python give it as base64 text in what goes to the
verifier (Go's `encoding/json` writes a `[]byte` field as base64 by itself;
Rust and Python do it in `describe`, which is not timed). The measured loop
reads only the two lengths.

## Left out

- `github.com/eapache/go-xerial-snappy`: a wrapper over `golang/snappy` that
  adds the xerial framing; its plain block calls are `golang/snappy`'s own.
- `github.com/glycerine/go-unsnap-stream`: a reader of the framing (stream)
  format, not the raw block format.

## Scope

A compress-only task on larger buffers, like `lz4-large-buffer-compress`, can
follow. LZ4, Zstandard, Brotli, bzip2 and LZW are measured in their own tasks.
Deflate, zlib and gzip are a separate category; archive formats are out of
scope.
See [shared methodology](../../README.md) for timing and reproduction.
