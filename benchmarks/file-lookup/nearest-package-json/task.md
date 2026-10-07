# Find the nearest package.json above a directory

One operation is given a list of absolute directory paths. For each it walks up
the parent directories, starting with the directory itself, and finds the
nearest one that holds a file named `package.json`. It returns a list with one
string per directory, in the same order: the absolute path of that
`package.json`.

This is a task on the file system (see "Tasks on the file system" in the
[shared methodology](../../README.md)). The directories are real. The harness
creates them in the task's scratch directory before each adapter process
starts, and each call looks them up again: nothing may be remembered from one
call to the next.

There are four trees (1,597 files in 135 directories), and a round covers each the same
number of times:

- `repo`: a monorepo with a `package.json` at the root, in five of six
  packages and in a package nested inside a package; the sixth package, `tools`
  and `docs` have none, so their directories resolve to the root. Source
  directories, an empty directory, and look-alike
  names beside the markers (`package.json.bak`, `package-lock.json`,
  `my-package.json`, `package.jsonc`). 44 starting directories.
- `deep`: a chain of 30 directories with a `package.json` at the top and at
  levels 9 and 19. 31 starting directories, one at every level.
- `wide`: four levels of 300 files each, the marker at the top. 4 starting
  directories.
- `names`: a dot directory, a directory with a space in its name, non-ASCII
  names (`ünï cödé`, `日本語`) and a nested package. 16 starting directories.

There is no symbolic link and every start has a `package.json` at or above it
inside its tree, so no walk leaves the tree. The marker is always a regular file.

## What is checked

The list must have one entry per starting directory, in order, and each must be
exactly the path of the nearest `package.json` (`<scratch>/repo/packages/pkg-01/package.json`).
Returning the outermost marker, the first one found from the top, a
look-alike, the directory instead of the file, or a relative path fails.
Nothing is forgiven. A package that returns a directory (`pkg-dir`, `find-root`)
has its adapter join `package.json` to it inside the measured call, in every
language alike.

## What the figure means

The trees were written a moment before and are in the operating system's
cache, for every entry alike, so no disk is read. CPU time is the process's
user and system time. The system part is the kernel answering the lookups; how
many calls a package makes (one `stat` per level, or a directory listing per
level that is then searched for the name) is its own choice and is counted,
which is why classes are closer together here than in a task on memory. The
time depends on the operating system and file system (macOS and APFS for the
published results).

Packages run with their default options and the starting directory in the
option their documentation gives (`cwd`; `escalade` and `find-root` take it as
the first argument). `escalade` is called with the documented callback that
returns the name when the listing holds it. Node's `findPackageJSON` keeps what
it has read in a cache of its own, which stays between calls; it also reads and
parses each manifest it finds, unlike the others.

## Left out

- `locate-path` and `path-exists` test paths they are given and do not walk
  up. `which` looks in `PATH`. `lilconfig` searches for configuration with its
  own search places and loaders, not for a named file. `path-type` tests a
  path's type.
- `findpython` (PyPI) finds Python interpreters and `hike` (RubyGems) looks in
  a set of paths for a file; neither walks up parents. No Python, Ruby or Go
  standard-library function does the job, and the job is not written by hand
  for a builtin entry.
- JSR has no package that does this.
