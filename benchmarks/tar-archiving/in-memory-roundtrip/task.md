# Tar pack and unpack, small files in memory

One operation takes a list of in-memory files, each `{ name, text }` with a
relative path and UTF-8 text content, packs them into a tar archive held in
memory (never touching the file system), then reads that archive back and
returns the entries it contains, as a list of `{ name, text }` in archive
order.

Each of the 24 inputs is a project-like tree of 20 to 204 small files (growing
by 8 per input), 100 bytes to a few kilobytes each: source code, JSON
configuration and locale files, Markdown, CSV, logs, nested directories,
Unicode text and non-ASCII path names, and an empty file in every sixth input.
Per-entry costs (the 512-byte header, padding, checksum, name handling, string
allocation) are a large share of the figure.

Every entry is written as a regular file with mode `0644`, modification time
`0` and its UTF-8 byte length as the size, because every writer needs those
three values and the task fixes them (no clock). The archive format and
everything else is each package's default: no compression, no gzip, no
directory entries, no ownership. Python's `tarfile` is opened with mode `w`
(uncompressed).

Two things are checked. The entries read back must be exactly the input list:
the same names, in the same order, and byte-for-byte the same text, so a package
that drops empty files, reorders entries or mangles non-ASCII names or text
fails. And the archive's byte length must be a whole number of 512-byte blocks
and at least what a tar of these entries needs (one header block per entry, each
entry's data padded to 512, and 1,024 bytes of end-of-archive zeros), and not
more than that plus 1,024 bytes per entry and 20,480 (extended headers, and
Python's padding of the archive to a 10,240-byte record). An adapter that hands
its input back, or compresses, fails. The bytes themselves are not compared:
writers legitimately differ in the end-of-archive padding and in the header
flavour (ustar, GNU, PAX) they use for names that do not fit ustar.
The check does not prove that entries were read out of the archive rather
than copied from the input; the task rule requires it and the adapters do it.

The archive is read back from the bytes just written, through the package's own
reader, and each entry is decoded from UTF-8 to a string. Each adapter returns
the entry list together with the archive's byte length, a number it already has;
the measured loop reads only the number of entries. Rust and Python convert that
pair to JSON for the verifier once per fixture, outside measured work, and Go's
result is marshalled then.

Whole-archive job only: no compression, no streaming, no files on disk.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- Rust: `tar` (`Builder` and `Archive` over a `Vec` and a `Cursor`).
- Python: standard library `tarfile` over `BytesIO`.
- Go: standard library `archive/tar` over `bytes.Buffer`.
- Ruby: `minitar` (`Minitar::Output` and `Minitar::Reader` over `StringIO`).

Left out: `tar-stream`, `@std/tar` and `@mary/tar` offer only streaming or
asynchronous APIs, which a synchronous task cannot wait for; `tar` and `tar-fs`
(npm) work on files or streams; Node, Bun and Deno ship no tar reader or writer.
Go's `estargz` and `tgz` are another job (seekable gzip layers, and a
file-system gzip walker). Ruby's standard library has no tar (its `rubygems`
internals are not a public API).
