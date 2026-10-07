# ZIP pack and unpack

One operation takes a list of in-memory files, each `{ name, text }` with a
relative path and UTF-8 text content, packs them into a ZIP archive held in
memory (never touching the file system), then reads that archive back and
returns the entries it contains, as a list of `{ name, text }` in archive
order.

The 47 inputs are of two sizes. 41 small ones hold 1 to 9 files each, from
empty files to a few kilobytes: source code, JSON, logs, CSV, prose, Unicode
text (including non-ASCII file names), nested directory paths and one
incompressible-looking base64 file; total input per archive is between zero
bytes and about 4 KB. 6 large ones hold 1 to 3 files of 100 KB to about
310 KB each (logs, JSON, source code, CSV, prose, Unicode text), 100 KB to
about 730 KB per archive, all of it text that deflate shrinks. Every fixture
is called equally often, so the large archives account for most of the time:
the figure is mostly compressing and decompressing data, with per-entry setup
a smaller share.

Entries are compressed with the deflate method at each package's default
level. Python's `zipfile` defaults to storing, so its adapter asks for
`ZIP_DEFLATED`, the one setting needed for the same job; Go's `archive/zip`
and Rust's `zip` crate deflate by default. Everything else is left at its
defaults, as installed. No encryption, no ZIP64, no comments, no directory
entries.

Two things are checked. The extracted entries must be exactly the input list:
the same names, in the same order, and byte-for-byte the same text, so a
package that drops empty files, reorders entries or mangles non-ASCII names or
text fails. And for the 6 large fixtures the archive's byte length must be
smaller than the total UTF-8 byte length of the input texts, so an adapter
that stores entries without compressing, or hands its input back without
building an archive, fails. The archive size is not checked for the 41 small
fixtures, where ZIP headers can outweigh what deflate saves. The compressed
bytes themselves are not compared, and neither is the compression ratio beyond
"smaller than the input": different deflate encoders legitimately produce
different (valid) archives. The check does not prove that the entries were
read back out of the archive rather than copied from the input; the task rule
requires it and the adapters do it.

The archive is read back from the bytes just written, through the package's
own reader, and each entry is decoded from UTF-8 to a string. Each adapter
returns the entry list together with the archive's byte length, a number it
already has; the measured loop reads only the number of entries. Rust and
Python convert that pair to JSON for the verifier once per fixture, outside
measured work, and Go's result is marshalled then.

This is the whole-archive job only: no tar, no bare deflate or gzip, no
streaming, no files on disk.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- Rust: `zip` (`ZipWriter` and `ZipArchive` over a `Cursor`).
- Python standard library: `zipfile` over `BytesIO`.
- Go standard library: `archive/zip` over `bytes.Buffer`.

Left out: `@zip-js/zip-js`, `@quentinadam/zip` and `@deno-library/compress`
expose only asynchronous (Web Streams, Promise) or file-system APIs, which
this synchronous task cannot call. Node, Bun and Deno ship no ZIP reader or
writer, and Ruby's standard library has none.
