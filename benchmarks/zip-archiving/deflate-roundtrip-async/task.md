# ZIP pack and unpack, awaited

The asynchronous form of [deflate-roundtrip](../deflate-roundtrip/task.md):
the same 47 inputs, through packages that write and read ZIP only through
promises or callbacks. One operation takes a list of in-memory files, each
`{ name, text }` with a relative path and UTF-8 text content, packs them
into a ZIP archive held in memory (never touching the file system), reads
that archive back through the package's reader, and returns
`{ entries, archive }`: the entries read back as a list of `{ name, text }`
in archive order, and the archive bytes they were read from.

The 47 inputs are those of deflate-roundtrip, drawn by the same
deterministic generator. 41 small ones hold 1 to 9 files each, from empty
files to a few kilobytes: source code, JSON, logs, CSV, prose, Unicode text
(including non-ASCII file names: `café`, `日本語`), nested directory paths,
a name with a space and one incompressible-looking base64 file; total input
per archive is between zero bytes and about 4 KB. 6 large ones hold 1 to 3
files of 100 KB to about 310 KB each, 100 KB to about 730 KB per archive,
all of it text that deflate shrinks. Every fixture is called equally often,
so the large archives account for most of the time: the figure is mostly
compressing and decompressing data. The scenario writes the generator out
again rather than importing it, because a scenario is loaded alone beside
each adapter; the two must be kept the same.

## The unit of work

The same steps in every adapter, all inside the measured call:

1. **Pack.** For each input file, in order, encode its text as UTF-8 with
   `TextEncoder` and hand it to the package's ZIP writer as a file entry
   under its name, with the package's default compression (deflate, at the
   default level). Then finish the archive the package's way and take its
   bytes as one `Uint8Array`. No directory entries, no comments, no
   encryption, no options for modification times (each package writes its
   own, usually the clock's; they are not checked).
2. **Unpack.** Give those bytes to the package's ZIP reader. For each entry
   it yields, in archive order, read the whole of its data, the empty
   file's included, as bytes, decode them as UTF-8 with `TextDecoder` and
   push `{ name, text }`.
3. **Return** `{ entries, archive }`.

## What counts as correct

Two things are checked, both exactly.

- The entries read back must be the input list: the same names, in the same
  order, byte-for-byte the same text, and no other fields. A package that
  drops the empty file, reorders entries or mangles non-ASCII names or text
  fails.
- The archive is read by the scenario's own strict ZIP reader (APPNOTE
  6.3), which uses none of the packages and inflates with `node:zlib`. It
  finds the end record, which must end the archive; the central directory
  must be where the end record says and hold exactly its count of entries;
  every entry must be stored (method 0) or deflated (method 8), not
  encrypted, and have a local header that agrees with its central header
  (flags, method, name, and CRC and sizes unless a data descriptor carries
  them); a data descriptor, where the flag says there is one, must agree
  too; the entries must follow one another from the start of the archive to
  the central directory with no bytes between them; and each entry's data,
  inflated, must have the size and CRC-32 its headers give. The names, read
  as the archive declares them, and the data must be those of the input, in
  order. For the 6 large fixtures every entry must be deflated and the
  archive must be smaller than the input's UTF-8 bytes, so a writer that
  stores everything, or hands its input back, fails.

Accepted differences, because they are spellings of the same archive:
stored or deflated for the 41 small fixtures (a writer may store an entry
that deflate does not shrink, as `@quentinadam/zip` does, and zip.js may store
empty files); data descriptors, with or without their signature; ZIP64
extra fields and end records; extra fields of any other kind (timestamps,
attributes); an archive comment; modification times; and the deflate bytes
themselves, which differ between encoders. The archive bytes are therefore
not compared between packages.

**Names must be declared in the encoding they are written in.** A ZIP name
is UTF-8 only when general-purpose flag bit 11 (the language-encoding flag)
is set; without it APPNOTE (section 4.4.4 and appendix D) says the name is
CP437. The reader therefore decodes a flagged name as UTF-8, an unflagged
one as CP437, unless an Info-ZIP Unicode Path extra field (0x7075) with a
matching CRC gives the UTF-8 name. An archive that writes `café` as UTF-8
bytes without the flag holds, for any reader that follows the
specification (Python's `zipfile` among them), the name `caf├⌐`, and fails.
`@quentinadam/zip` 0.1.17 writes UTF-8 names with flags `6` (bit 11 clear),
so it fails on every fixture with a non-ASCII name (it reads its own
archives back because it decodes every name as UTF-8). It is kept, and
recorded as not passing, because zip.js and fflate set the flag; the
fixtures are not narrowed to ASCII names to let it in.

The scenario asserts at load that its reader accepts an archive written
plainly, with data descriptors (with and without their signature, with the
sizes in the local header or zero there), with ZIP64 extra fields and end
records, with a comment, with Unicode Path extra fields, with CP437 names,
with stored empty or small entries, in a `Buffer` and in a plain
`Uint8Array`; and that the check refuses: the input echoed as JSON, a gzip
stream, no archive, a bad CRC-32, a changed file in the archive, an
encrypted entry, compression method 9, a wrong entry count in the end
record, data after the end record, bytes between entries, an extra entry, a
directory entry, entries reordered in the archive, UTF-8 names without the
language-encoding flag, the large fixtures stored, a changed file or
reordered entries read back, entries read back with extra fields, another
fixture's output, and the empty file dropped.

What the check cannot see is whether the entries returned came out of the
package's reader rather than from the input; the task requires the reading
step, and every adapter does it.

## What is measured, and what is not

This is an asynchronous task on **one thread** (`load.threads` is 1) with
one operation at a time (`load.concurrency` is 1): the runner awaits each
operation before it starts the next. The writer, the reader and every
stream or worker are created inside the measured call. The UTF-8 encoding
and decoding of the texts are the same in every adapter. Memory is that
after the rounds, above the warm baseline, as in every task. No file
system, no timer or sleep.

- **Threads.** Every adapter's own code runs on the one JavaScript thread,
  but not all of the packages' work does. zip.js and `@quentinadam/zip`
  deflate and inflate through the runtime's `CompressionStream` and
  `DecompressionStream`, whose work a runtime may do off the JavaScript
  thread. fflate's `zip` deflates each file of 160,000 bytes or more in a
  worker thread it starts for that file (four files per pass over the
  fixtures, all in the large ones), and smaller files with its synchronous
  deflate; its `unzip` inflates everything under 512 KB synchronously. The
  package offers no option to turn the workers off, so they are part of its
  figure, start-up included. CPU is that of the whole process, every thread
  included, so all of this is counted; it is not multiplied by anything.
- **zip.js is told not to use web workers** (`useWebWorkers: false`, on the
  writer and the reader). Its default would start workers of its own on Bun
  and Deno, which have a global `Worker`, and not on Node, which has none;
  turning them off gives every runtime the same work on the calling thread.
  Its other defaults stay, `useCompressionStream: true` among them.

## Packages

Each runs with its default options apart from zip.js's workers.

- `@zip-js/zip-js` (JSR): `const writer = new ZipWriter(new Uint8ArrayWriter(),
  { useWebWorkers: false })`, `await writer.add(name, new Uint8ArrayReader(bytes))`
  per file, one after another, then `const archive = await writer.close()`;
  `const reader = new ZipReader(new Uint8ArrayReader(archive), { useWebWorkers: false })`,
  `await reader.getEntries()`, and for each entry
  `await entry.getData(new Uint8ArrayWriter())`, then `await reader.close()`.
- `@quentinadam/zip` (JSR): `const archive = await create(files)` with
  `files` a list of `{ name, data }`; then `await extract(archive)`, a list
  of `{ name, data }`. Deflates through `CompressionStream('deflate-raw')`
  and stores an entry when that is not smaller. Recorded as not passing
  (names without the UTF-8 flag, above).
- `fflate` (npm): `zip(files, callback)` with `files` an object from each
  name to its bytes (keys in input order), and `unzip(archive, callback)`,
  each wrapped in one promise; the entries are the object `unzip` gives, in
  its key order, which is archive order for these names (none is an
  integer-like key).

## Left out

- Standard libraries: Node, Bun and Deno ship no ZIP reader or writer.
  Python's `zipfile` and Go's `archive/zip` work in blocking calls over
  in-memory buffers and are measured in deflate-roundtrip; Ruby's standard
  library has none. So there is no builtin entry.
- The Rust `zip` crate and the gem `rubyzip`: blocking, measured in
  deflate-roundtrip.
- `@deno-library/compress` writes and reads ZIP archives only as files on
  disk; this task is in memory.
- `fflate`'s `zipSync` and `unzipSync`: the synchronous calls, which belong
  in deflate-roundtrip, not here.

See [shared methodology](../../README.md) for timing and reproduction.
