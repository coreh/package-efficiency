# Replace files atomically

One operation is given a list of files, each with an absolute `path`, new
`content` (a UTF-8 string) and the permission bits `mode` the file has. Every
file already exists with different, older contents. The operation replaces each
one with the new content so that a reader sees the old file or the complete new
one, never a partial file: the new bytes go to a temporary file in the same
directory, which is renamed over the old one. The operation returns nothing; its
result is on the disk.

This is a task on the file system (see "Tasks on the file system" in the
[shared methodology](../../README.md)). The harness creates the files in the
task's scratch directory before each adapter process starts. Every call writes
the same bytes to the same files, so nothing is reset between calls: the first
call changes the files and later calls replace them with identical contents.

There are two cases, replaced alternately:

- `small`: 121 text files of 0 to 8 KB in 15 directories (one holds a name with
  a space, others non-ASCII names, a dot directory, a chain five directories
  deep). It has an empty new content, dot files, names with spaces and
  non-ASCII characters, files with mode 755, 640 and 600 and the rest 644.
- `large`: 8 files of 256 KB each, one with mode 600 and one with mode 755.

There are no symbolic links.

## What is checked

After the first call the directories are read back from the disk. They must
hold exactly the declared files and directories, so a temporary file left
beside its target fails. Every file must be a regular file whose bytes are the
new content, with the permission bits it had before (the old file's, not the
temporary file's). File times and ownership are not compared. The check cannot
see whether a reader could have observed a partial file; it checks the outcome
of the replacement, not its atomicity.

A package that does not keep the permission bits of the replaced file by
default fails the check. It is entered with its defaults and recorded as not
passing; where the package has an option that keeps them, a variant beside it
sets that option and is the one that passes. The mode is given to every
adapter in the input; an adapter passes it only where the package's API takes
it (google/renameio requires a permission argument; the two variants set it).

## What the figure means

CPU time is the process's user and system time. Most of it is system time: the
kernel creating a temporary file, writing it and renaming it for every file.
The files are in the operating system's cache.

- Durability is not measured. Packages differ in whether they ask the kernel
  to flush the temporary file to the disk (`fsync`) before the rename, and
  some make it an option. Waiting for the disk is not CPU time and is not in
  the figure, whichever way a package defaults; the system call itself costs a
  little CPU. Each package is used with its defaults, so the entries differ in
  that policy as in everything else.
- Where the temporary file goes differs: next to the target for most; atomos
  uses the system temporary directory unless given another, so it is given the
  target's directory (`tmpdir:`), as the rule for these tasks requires.
- The cost of creating a file depends on the operating system and the file
  system far more than on the package.

## Packages

- npm: `write-file-atomic` (`sync`), `atomically` (`writeFileSync`).
- PyPI: `boltons` (`fileutils.atomic_save`), `atomicwrites` (`atomic_write`;
  not passing).
- RubyGems: `atomos` (`Atomos.atomic_write`; not passing).
- Go modules: `google/renameio` v2 (`WriteFile`), `natefinch/atomic`
  (`WriteFile`).
- crates: `atomic-write-file`, `atomicwrites` (not passing) with the variant
  `atomicwrites-mode`, `tempfile` (`NamedTempFile::persist`; not passing) with
  the variant `tempfile-permissions`.

Left out:

- No standard library has a function that does this job. Node's `fs`, Python's
  `os`, Ruby's `File` and Go's `os` have a rename and a temporary-file helper,
  but the atomic write is code written around them, which is the job being
  measured, so there is no `builtin/` entry.
- JSR has no package for it.
- `steno` and `fast-write-atomic` (npm) have only asynchronous interfaces, and
  `renameio`'s `PendingFile` interface is the same call in several steps; only
  `WriteFile` is entered.
- Advisory file locking, plain copy and temporary-file creation alone are not
  this job.
