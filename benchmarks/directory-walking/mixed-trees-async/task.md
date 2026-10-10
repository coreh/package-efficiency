# List every file and directory under a root, awaited

The asynchronous form of [mixed-trees](../mixed-trees/task.md): the same
trees and the same check, through packages' awaited interfaces (a promise, or
a callback wrapped in one), which hand the file-system calls to other threads
and settle when the walk is done.

One operation is given the absolute path of a directory and returns a promise
of the path of every file and every directory below it, at any depth, as a
list of strings.

This is a task on the file system (see "Tasks on the file system" and "Files
that operations write" in the [shared methodology](../../README.md)). The
directories are real. The harness creates them in the task's scratch
directory before each adapter process starts, and each call walks them again:
nothing may be remembered from one call to the next. Operations only read.

There are four trees, made by the same generator with the same seed as in
mixed-trees, and a round walks each the same number of times:

- `app`: a source project of 12 packages with nested source, test and
  documentation directories of 6 to 47 files, dot files, a dot directory, an
  empty directory in every package, and names with spaces and non-ASCII
  characters (2,778 entries).
- `wide`: three directories of 400 files each (1,203 entries).
- `deep`: a chain of 40 directories, four files at each level (200 entries).
- `modules`: 90 installed-package folders, some under a scope directory, with
  5 to 17 files each in one to three directories (1,424 entries).

There are no symbolic links, no unreadable directories and nothing to ignore.

## What is checked

The list must hold every file and every directory exactly once and nothing
else. A dot file left out, an empty directory left out, an entry listed twice
or a path that is not on the disk all fail. Three things are forgiven, because
they are the same answer in another spelling: the order of the list (a walker
with several directory reads in flight returns entries in whatever order they
arrive); whether a path is absolute or relative to the root
(`fs.promises.readdir` gives relative paths, most walkers give the root joined
to them); and whether the root itself is in the list. A trailing slash on a
directory is ignored.

The scenario asserts at load that the forgiven spellings pass (relative
paths; absolute paths with the root listed, in reverse order; directories
with a trailing slash and files with `./`) and that each of these is refused:
a list without dot files, files only, directories only, one entry left out of
every tree, an entry listed twice, a path that is not on the disk, names in
another Unicode normalization form, base names in place of paths, the last
entry dropped, another fixture's list, and a count in place of the list.

The result is a list of strings. A package that returns entry objects has its
adapter read the path of each inside the measured call (`@nodelib/fs.walk`,
`readdirp`). No adapter sorts. The measured loop reads only the length of the
list.

## What is measured, and what is not

This is an asynchronous task with one walk at a time (`load.concurrency` is
1): the runner awaits each operation before it starts the next. Inside one
walk, how many directory reads a package has in flight at once is its own
choice and part of its figure; every package runs with its default. The
walker object, where
a package has one, is created inside the measured call.

- **Threads.** `load.threads` is 1: every adapter's own code runs on the one
  JavaScript thread. The file-system calls themselves run on libuv's thread
  pool on Node and Bun's and Deno's equivalents, while the JavaScript thread
  waits. CPU is that of the whole process, every thread included, so that
  work is counted; it is not multiplied by anything.
- **The kernel's part.** The trees were written a moment before and are in
  the operating system's cache, for every entry alike, so no disk is read. CPU
  time is the process's user and system time. The system part is the kernel
  listing directories and, for a walker that asks, reporting on each entry. It
  is counted because how often a walker calls the kernel is its own choice,
  and it is most of the figure: every entry on a machine pays about the same
  for the calls nobody can avoid, so classes are closer together here than in
  a task on memory. The time a call spends inside the kernel depends on the
  operating system and the file system (macOS and APFS for the published
  results).
- No timer or sleep is involved anywhere.

Set beside mixed-trees, the figures of the packages that are in both show
what the awaited form costs over the blocking one: the same walk, with each
directory read handed to another thread and back.

## Packages

Packages run with the options the job needs and no others.

- `fdir` (npm): `await new fdir().withFullPaths().withDirs().crawl(root).withPromise()`;
  a new crawler for every call.
- `@nodelib/fs.walk` (npm): `walk(root, callback)`, wrapped in a promise that
  rejects on the callback's error and otherwise resolves to the path of each
  entry (`entries.map((entry) => entry.path)`).
- `readdirp` (npm): `(await readdirp.promise(root, { type: 'files_directories' }))`
  mapped to `entry.fullPath`. Its default `type` is `'files'`, which leaves the
  directories out and fails the check.
- `path-scurry` (npm): `await new PathScurry(root).walk({ withFileTypes: false })`;
  a new `PathScurry` for every call, because it keeps what it has read in that
  object.
- Standard library: `fs.promises.readdir` with `recursive: true`, awaited
  (Node, Bun and Deno each have their own).

## Left out

- Python, Ruby and Go standard libraries: Python has no asynchronous walker in
  its standard library (`os.walk` blocks; `asyncio` has no file-system
  functions), and Ruby's `Find.find` and Go's `filepath.WalkDir` block.
  Those three are measured in mixed-trees, and a blocking call in this task
  would measure the same thing again.
- `walkdir` and `ignore` (Rust): synchronous walkers, measured in mixed-trees.
  Rust's `tokio::fs` has `read_dir` but no recursive walk, and a walk written
  by hand from it would be our code, not a library's.
- `rignore` (PyPI), `kr/fs` and `godirwalk` (Go modules): synchronous, and
  measured in mixed-trees.
