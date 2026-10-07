# Copy a directory tree

One operation is given two absolute paths, `from` and `to`, and copies the
directory tree at `from` to `to`. `to` does not exist when the operation
starts; its parent does. The operation returns nothing: its result is the new
tree on the disk.

This is a task on the file system (see "Tasks on the file system" in the
[shared methodology](../../README.md)). The harness creates the source trees
in the task's scratch directory before each adapter process starts. Before
every operation it removes the destination, and that removal is not timed.

There are two source trees, copied alternately:

- `project`: 302 files of 0 to 4 KB in 39 directories. It has an empty file,
  an empty directory, dot files, names with spaces and non-ASCII characters, a
  chain six directories deep, six executable files (mode 755) and four private
  files (mode 600).
- `assets`: 24 binary files of 64 to 192 KB in three directories, 3 MB in all.

There are no symbolic links.

## What is checked

After the copy, the destination is read back from the disk. It must hold
exactly the directories and files of the source, the empty directory included.
Every file must be a regular file with the same bytes as its source and the
same permission bits. File times are not compared: the packages differ on
whether they keep them by default, and each runs with its defaults.

## What the figure means

CPU time is the process's user and system time. Here nearly all of it is
system time: the kernel creating directories and files and copying their
contents. The entries differ in which system calls they make per file, and
that is their own doing, so it is counted. Three things follow.

- Waiting for the disk is not CPU time. Nothing here asks for the data to be
  on the disk before returning, and the figure would not show it if it did.
- How the bytes get across is each implementation's choice. On a file system
  that can share blocks between files (APFS, where the published results were
  measured), an implementation may ask the kernel to clone a file instead of
  copying its bytes, which costs almost nothing for a large file.
- The cost of creating a file depends on the operating system and the file
  system far more than on the package.

## Packages

- npm: `fs-extra` (`copySync`).
- Standard libraries: `fs.cpSync` with `recursive: true` (Node, Bun and Deno
  each have their own), Python `shutil.copytree`, Ruby `FileUtils.cp_r`.

Left out:

- Go's `os.CopyFS` does not do this job. It creates every file with mode 666
  less the umask, plus the source's execute bits, so a private file (600)
  comes out readable by everyone (644). It fails the check on permission bits.
- Rust's standard library has no recursive copy.
- The Go modules `otiai10/copy`, `cespare/cp` and `mrunalp/fileutils` can join
  when Go modules can be adapters of this kind of task.
