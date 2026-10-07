# Create and remove temporary files and directories

One operation is given the absolute path of an existing, empty directory
(`root`), a number of files, a number of directories, and the name parts to
use. It creates that many uniquely named temporary files directly in `root`,
writes 1 KiB to each, creates that many uniquely named temporary directories
directly in `root`, and then removes everything it created. It returns the
paths of what it created: the files first, then the directories. Everything
exists at the same time before the removal starts.

This is a task on the file system (see "Tasks on the file system" in the
[shared methodology](../../README.md)). The temporary root is a directory in
the task's scratch directory, never the system's temporary directory, so every
entry works on the same file system and the same path length.

There are two cases, called alternately, each with its own root:

- 240 files and 24 directories;
- 40 files and 120 directories.

Files are named `bench-<random>.dat` and directories `bench-dir-<random>`.
Every file gets the same 1 KiB of bytes (`(i * 7 + 3) & 255` for byte `i`),
built once in the adapter's module (in the `prepare` step in Rust), not per
call.

## What is checked

The paths returned must be as many as asked, all different, and each must be
directly in `root`, with the prefix and suffix asked for. The root must hold
nothing afterwards: a file or directory left behind fails. The root's
modification time must have moved from the one the harness gave it, so an
implementation that only invents names fails. Order is not compared and the
random part of a name is not, since it cannot be known. The bytes written
cannot be read back, because the files are gone; writing them is part of the
work every entry does, but the check does not see it.

## What the figure means

CPU time is the process's user and system time, and here most of it is system
time: the kernel creating, writing and unlinking. Waiting for the disk is not
CPU time, and nothing asks for the data to reach the disk. The root is empty
and in the operating system's cache. Entries differ in how they pick a name
(how many attempts, how much randomness), how they open and close the file,
and how they remove it; all of that is the package's own and is counted.
Results are returned as owned strings in every language.

## Packages

- npm: `tmp` (`fileSync`, `dirSync`, `removeCallback`). The data is written
  with `fs.writeSync` to the descriptor the package returns.
- JSR: `@david/temp` (`createTempFileSync`, `createTempDirSync`, removal by
  disposing the object). The file is written with `Path.writeSync`.
- Crates: `tempfile` (`Builder::tempfile_in`, `Builder::tempdir_in`, `close`).
- Standard libraries: Python `tempfile` (`NamedTemporaryFile`,
  `TemporaryDirectory`), Ruby `Tempfile` and `Dir.mktmpdir`, Go
  `os.CreateTemp` and `os.MkdirTemp` (removed with `os.Remove`, since Go has
  no cleanup object).

Left out:

- Node, Bun and Deno have no function for a temporary file; `fs.mkdtemp`
  only makes directories, so there is no JavaScript builtin entry.
- `github.com/hashicorp/go-safetemp` makes only a temporary directory, built
  for a different purpose (a safe place for `go-getter` to download into). It
  has no temporary files, so it does not do this job.
- No PyPI package or gem in the category's brief; the standard library is the
  entry in those languages.
