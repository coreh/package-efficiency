# ZIP pack and unpack, many small files

One operation takes a list of in-memory files, each `{ name, text }` with a
relative path and UTF-8 text content, packs them into a ZIP archive held in
memory (never touching the file system), then reads that archive back and
returns the entries it contains, as a list of `{ name, text }` in archive
order.

This is the second ZIP task. `deflate-roundtrip` is dominated by a few large
entries, so it mostly measures deflate throughput. Here each of the 36 inputs
is a project-like tree of 40 to 390 small files (growing by 10 per input), 100 bytes to a few kilobytes each, 25 KB to 260 KB per archive:
source code, JSON configuration and locale files, Markdown, CSV, logs, nested
directories, Unicode text and non-ASCII path names, and an empty file in every
sixth input. Per-entry costs (headers, the central directory, compressor and
decompressor setup, name handling, string allocation) are a large share of the
figure.

Entries are compressed with the deflate method at each package's default
level. Python's `zipfile` defaults to storing, so its adapter asks for
`ZIP_DEFLATED`, the one setting needed for the same job; Go's `archive/zip`
and Rust's `zip` crate deflate by default. Everything else is left at its
defaults, as installed. No encryption, no ZIP64, no comments, no directory
entries.

Two things are checked. The extracted entries must be exactly the input list:
the same names, in the same order, and byte-for-byte the same text, so a
package that drops empty files, reorders entries or mangles non-ASCII names or
text fails. And for every fixture the archive's byte length must be smaller
than the total UTF-8 byte length of the input texts (all fixtures are
compressible text, so even with headers a deflate archive is smaller), so an
adapter that stores entries without compressing, or hands its input back
without building an archive, fails. The compressed bytes themselves are not
compared: different deflate encoders legitimately produce different (valid)
archives. The check does not prove that the entries were read back out of the
archive rather than copied from the input; the task rule requires it and the
adapters do it.

The archive is read back from the bytes just written, through the package's
own reader, and each entry is decoded from UTF-8 to a string. Each adapter
returns the entry list together with the archive's byte length, a number it
already has; the measured loop reads only the number of entries. Rust and
Python convert that pair to JSON for the verifier once per fixture, outside
measured work, and Go's result is marshalled then.

Whole-archive job only: no tar, no bare deflate or gzip, no streaming, no
files on disk.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- Rust: `zip` (`ZipWriter` and `ZipArchive` over a `Cursor`).
- Python standard library: `zipfile` over `BytesIO`.
- Go standard library: `archive/zip` over `bytes.Buffer`.

Left out: `@zip-js/zip-js`, `@quentinadam/zip` and `@deno-library/compress`
expose only asynchronous (Web Streams, Promise) or file-system APIs. Node, Bun
and Deno ship no ZIP reader or writer, and Ruby's standard library has none.
