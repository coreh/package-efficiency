# Tar pack and unpack through streams, small files in memory

The streaming form of [in-memory-roundtrip](../in-memory-roundtrip/task.md):
the same 24 inputs, through packages that write and read tar only as streams.
One operation takes a list of in-memory files, each `{ name, text }` with a
relative path and UTF-8 text content, writes them into a tar byte stream,
collects that stream into one archive, streams the archive back through the
package's tar reader, reads every entry, and returns
`{ entries, archive }`: the entries read back as a list of `{ name, text }`
in archive order, and the archive bytes they were read from.

Each of the 24 inputs is a project-like tree of 20 to 204 small files
(growing by 8 per input), 100 bytes to a few kilobytes each: source code,
JSON configuration and locale files, Markdown, CSV, logs, nested
directories, Unicode text and non-ASCII path names, and an empty file in
every sixth input. Every name fits the 100-byte name field of a plain ustar
header (the scenario asserts it at load), so no writer needs a name prefix
or an extended header. The scenario writes the generator of
in-memory-roundtrip out again rather than importing it, because a scenario
is loaded alone beside each adapter; the two must be kept the same.

## The unit of work

The same steps in every adapter, all inside the measured call:

1. **Pack.** Create the package's tar writer. For each input file, in order,
   encode its text as UTF-8 with `TextEncoder` and hand the writer a
   regular-file entry: the name, the byte length as its size, mode `0644`
   and modification time `0` (in the package's unit, seconds or
   milliseconds). Every writer needs those values and the task fixes them,
   so no entry depends on the clock. Then finish the archive the package's
   way. No directory entries, no ownership, no compression.
2. **Collect.** Read every chunk the writer emits through the package's
   stream (a Node-style stream for `tar-stream`, a web `ReadableStream` for
   the JSR packages), push it to an array, and concatenate the array once
   into one `Uint8Array`, the archive.
3. **Unpack.** Give the archive to the package's tar reader as one chunk
   (`ReadableStream.from([archive])` for a web-stream reader,
   `extract.end(archive)` for `tar-stream`). For each entry it yields, in
   order, read the whole body to its end, the empty file's included, with
   the package's own method if it has one (`@mary/tar`'s `entry.bytes()`),
   otherwise by collecting the body stream's chunks and concatenating them
   once; decode the bytes as UTF-8 and push `{ name, text }`. The next entry
   is asked for only after a body has been read.
4. **Return** `{ entries, archive }`.

`@mary/tar` writes one entry at a time (`writeTarEntry`, a header and padded
data per call) and has no end-of-archive writer: its adapter enqueues each
entry's buffer into a `ReadableStream` and, after the last entry, the two
512-byte zero blocks that end every POSIX tar archive. That constant is the
only tar byte an adapter writes itself.

## What counts as correct

Two things are checked, both exactly.

- The entries read back must be the input list: the same names, in the same
  order, byte-for-byte the same text, and no other fields. A package that
  drops the empty file, reorders entries or mangles non-ASCII names or text
  fails.
- The archive is read by the scenario's own strict tar reader, which uses
  none of the packages. It must be whole 512-byte blocks; every header must
  have a valid checksum and well-formed octal fields and be a POSIX ustar
  (`ustar\0` `00`) or GNU (`ustar  \0`) header; every entry must be a regular
  file (type `0` or NUL), and its name (from the name field, the ustar
  prefix, a PAX `path` record or a GNU long name), mode (`0644`),
  modification time (`0`, from the header or a PAX `mtime` record) and data
  must be those of the input, in order; padding must be zero; and the
  archive must end with at least two zero blocks and nothing but zeros after
  them. So an adapter that hands its input back, compresses, skips the
  end-of-archive blocks, leaves the default mode `0664` of `@mary/tar` or a
  modification time from the clock, adds directory entries, or reorders or
  changes an entry fails.

Accepted differences, because they are spellings of the same archive: the
header flavour (ustar, GNU, or extended PAX or GNU long-name headers before
an entry), owner and group ids and names, and how many zero bytes follow the
two end-of-archive blocks (padding to a 10,240-byte record is allowed). The
archive bytes are therefore not compared between packages.

The scenario asserts at load that its reader accepts an archive written as
plain ustar, with ustar name prefixes, with PAX headers, with GNU long names
and padded to a record, in a `Buffer` and in a plain `Uint8Array`, and that
the check refuses: the input echoed as JSON, a gzipped archive, no archive, a
bad header checksum, no end-of-archive blocks, one end-of-archive block,
entries reordered in the archive, a changed file in the archive, mode `0664`,
a modification time from the clock (in the header and in a PAX record),
non-zero padding, a directory entry, data after the end of the archive, a
changed file or reordered entries read back, entries read back with extra
fields, another fixture's output, and the empty file dropped. It also checked
the reader against Python's `tarfile` in its PAX, GNU and ustar formats.

What the check cannot see is whether the entries returned came out of the
package's reader rather than from the input; the task requires the reading
step, and every adapter does it.

## What is measured, and what is not

This is an asynchronous task on **one thread** (`load.threads` is 1) with one
operation at a time (`load.concurrency` is 1): the runner awaits each
operation before it starts the next. The writer, the reader and every stream
are created inside the measured call. The figure is the package's tar work
(headers, checksums, padding, parsing) plus its stream machinery and the
promise and event-loop turns that machinery needs: `tar-stream` runs on
`streamx` streams, `@std/tar` on web byte streams (re-chunked to 512-byte
blocks on reading), `@mary/tar` on web streams and an async generator.
Per-entry costs are a large share of the figure, as in in-memory-roundtrip,
and here they include the stream overhead of each entry. The UTF-8 encoding
and decoding of the texts and the one concatenation of the archive are the
same in every adapter. Memory is that after the rounds, above the warm
baseline, as in every task. No file system, no timer or sleep.

## Packages

Each runs with its default options apart from mode and modification time.

- `tar-stream` (npm): `const pack = tar.pack()`, `pack.entry({ name, size,
  mode: 0o644, mtime: new Date(0) }, bytes)` per file, `pack.finalize()`, the
  chunks collected by iterating `pack`; then `const extract = tar.extract()`,
  `extract.end(archive)`, and `for await (const entry of extract)` with each
  entry's body collected from the entry stream (`entry.header.name`).
- `@std/tar` (JSR): `ReadableStream.from(files).pipeThrough(new TarStream())`
  where each file is `{ type: 'file', path, size, readable, options: { mode:
  0o644, mtime: 0 } }` and `readable` is a stream of its bytes, the output
  collected through its reader; then
  `ReadableStream.from([archive]).pipeThrough(new UntarStream())` and, for
  each entry, its `readable` collected to the end (`entry.path`).
- `@mary/tar` (JSR): `writeTarEntry({ filename, data, attrs: { mode: 0o644,
  mtime: 0 } })` per file, enqueued into a `ReadableStream` followed by the
  two zero blocks (see above), collected through its reader; then
  `for await (const entry of untar(ReadableStream.from([archive])))` with
  `await entry.bytes()` (`entry.name`).

## Left out

- Standard libraries: Node, Bun and Deno ship no tar reader or writer.
  Python's `tarfile` and Go's `archive/tar` work in blocking calls over
  in-memory buffers and are measured in in-memory-roundtrip; their stream
  modes (`tarfile` mode `w|`, an `io.Pipe` in Go) are the same code with
  blocking reads and writes, so there is no builtin entry here.
- The Rust `tar` crate and Ruby's `minitar`: blocking, measured in
  in-memory-roundtrip.
- `tar` and `tar-fs` (npm) work on the file system; see pack-directory.
- Compressed archives (`.tar.gz`) and seekable layers (`estargz`): another
  job.

See [shared methodology](../../README.md) for timing and reproduction.
