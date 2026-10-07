# List every file and directory under a root

One operation is given the absolute path of a directory and returns the path
of every file and every directory below it, at any depth, as a list of
strings.

This is a task on the file system (see "Tasks on the file system" in the
[shared methodology](../../README.md)). The directories are real. The harness
creates them in the task's scratch directory before each adapter process
starts, and each call walks them again: nothing may be remembered from one
call to the next.

There are four trees, and a round walks each the same number of times:

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
they are the same answer in another spelling: the order of the list; whether a
path is absolute or relative to the root (`fs.readdirSync` gives relative
paths, most walkers give the root joined to them); and whether the root itself
is in the list. A trailing slash on a directory is ignored.

The result is a list of strings in every language. A package that returns
entry objects has its adapter read the path of each inside the measured call
(`@nodelib/fs.walk`), and one that yields entries one at a time has them
collected into a list (`walkdir`, `ignore`, Go's `WalkDir`, Python's
`os.walk`). No adapter sorts. The measured loop reads only the length of the
list. Rust converts its paths to JSON for the check once per tree, outside
measured work.

## What the figure means

The trees were written a moment before and are in the operating system's
cache, for every entry alike, so no disk is read. CPU time is the process's
user and system time. The system part is the kernel listing directories and,
for a walker that asks, reporting on each entry. It is counted because how
often a walker calls the kernel is its own choice, and it is most of the
figure: every entry on a machine pays about the same for the calls nobody can
avoid, so classes are closer together here than in a task on memory. The time
a call spends inside the kernel depends on the operating system and the file
system (macOS and APFS for the published results).

Packages run with the options the job needs and no others: `fdir` is asked
for directories and full paths, `path-scurry` for strings, `ignore` has its
ignore-file, hidden-file and git rules turned off so that it lists everything.
`path-scurry` keeps what it has read in the object it was created from, so its
adapter creates a new one for every call.

## Packages

- npm: `fdir`, `path-scurry`, `@nodelib/fs.walk`.
- Rust: `walkdir`, `ignore`.
- Standard libraries: `fs.readdirSync` with `recursive: true` (Node, Bun and
  Deno each have their own), Python `os.walk`, Ruby `Find.find`, Go
  `filepath.WalkDir`.

Left out: `readdirp` only has asynchronous interfaces (a stream and a
promise). `rignore` (PyPI), `kr/fs` and `godirwalk` (Go modules) can join when
packages from those registries can be adapters of this kind of task.
