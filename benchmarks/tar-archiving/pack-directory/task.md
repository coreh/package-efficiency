# Pack a directory into a tar file and extract it

One operation is given three absolute paths, `source`, `archive` and
`target`. It packs the directory tree at `source` into an uncompressed tar
file at `archive`, then extracts that file into `target`, which it creates.
Neither `archive` nor `target` exists when the operation starts; the parent of
each does. The operation returns nothing: its result is the archive and the
new tree on the disk.

This is a task on the file system (see "Tasks on the file system" in the
[shared methodology](../../README.md)). The harness creates the source trees
in the task's scratch directory before each adapter process starts. Before
every operation it removes the archive and the destination, and that removal
is not timed.

There are two source trees, packed and extracted alternately:

- `project`: 212 text files of 0 to 4 KB in 42 directories, 350 KB in all. It
  has an empty file, an empty directory, dot files, a name with spaces, names
  that are not ASCII (`café/résumé.md`, `日本語/はじめに.md`), a chain six
  directories deep, a path of 112 bytes (longer than the 100 bytes of a tar
  name field, short enough for the ustar prefix, so every header flavour can
  hold it), four executable files (mode 755) and three private files (mode
  600).
- `assets`: one binary file of exactly 1 MiB and 12 of 32 to 160 KB in four
  directories, 2.3 MB in all.

There are no symbolic links or hard links: packages differ on whether they
follow a link or store it, and each runs with its defaults.

## What is checked

Both halves of the job are checked, after the operation, from the disk.

- The archive is read with a strict tar reader in the scenario (ustar with
  its prefix field, GNU long names, PAX `path` records; a bad header checksum,
  a truncated entry, a missing end-of-archive block or an unknown entry type
  fails). It must hold every file of the source exactly once, as a regular
  file with the same bytes, and the empty directory as a directory entry.
  Any other entry must be a directory of the source. A compressed archive is
  not a tar file and fails. Entry order, the header flavour (ustar, GNU, PAX),
  a `./` before names, an entry for the root, the other directory entries, and
  the padding after the end-of-archive block are each package's own and are
  not compared.
- The destination must hold exactly the directories and files of the source,
  the empty directory included, and nothing else. Every file must be a
  regular file with the same bytes as its source and the same permission bits
  (755, 600, 644). Directory permissions, file times and ownership are not
  compared: the packages differ on whether they restore them by default.

The scenario checks itself when it loads: a correct archive and tree pass,
and an archive without the empty file, with changed bytes, with an extra file,
without the empty directory or without its end block fails, as does a tree
without the empty file or directory, or with a lost mode 600 or 755.

## What the figure means

CPU time is the process's user and system time, and a large part of it is
system time: the kernel reading the source, writing the archive, then
creating the directories and files of the destination. The files are in the
operating system's cache before anything is measured, so nothing is read from
the disk, and waiting for the disk is not CPU time: nothing asks for the data
to reach it. The entries differ in how they read and write (buffer sizes, how
many calls per file, whether they `stat` each entry again on extraction), and
that is their own doing, so it is counted. Every entry pays about the same for
the calls nobody can avoid, so they are closer together than in a task on
memory.

Both halves are one operation, with the archive written to the file and then
read back from it, because that is the job the packages offer as two calls on
paths. Packages that check what they extract (Python's `data` filter refuses
absolute paths, links out of the target and device files) do that work as
part of the figure.

## Packages

- npm: `tar` (`c` and `x` with `sync: true`, `file` and `cwd`; the target is
  created with `fs.mkdirSync` first, since `x` extracts into an existing
  directory).
- PyPI: `fastar` (`open(archive, 'w')` and `append`, then `open(archive, 'r')`
  and `unpack`).
- Crates: `tar` (`Builder::append_dir_all` over a `File`, then
  `Archive::unpack`).
- RubyGems: `minitar` (`Minitar.pack` into a `File`, then `Minitar.unpack`).
- Standard library: Python `tarfile` (`open` with mode `w` and `add` with
  `arcname='.'`, then `extractall` with `filter='data'`).

Left out:

- `tar-fs` (npm) binds `tar-stream` to the file system with streams only, and
  `tar-stream` itself is a stream: neither has a synchronous form. They belong
  in an asynchronous task with the same files.
- `alcortesm/tgz` (Go) only extracts gzip archives: another job.
- Go's `archive/tar` can pack a directory in one call (`Writer.AddFS`) but has
  no function that extracts an archive to a directory, so Go has no builtin
  entry; the job is not written by hand.
- Node, Bun and Deno ship no tar reader or writer, and Ruby's standard library
  has none (the `rubygems` internals are not a public API). Rust's standard
  library has none.
- A package that runs the `tar` command cannot be an entry: work done in a
  child process is not counted.
