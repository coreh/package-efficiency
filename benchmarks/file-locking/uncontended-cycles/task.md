# Lock and unlock a lock file

One operation is given the absolute path of a lock file that exists, and runs
20 cycles. A cycle is:

1. make a handle `A` on the path with the package and take an exclusive lock
   on it (waiting if need be; nobody else holds it);
2. make a second handle `B` on the same path and try to take the lock without
   waiting. While `A` holds the lock this must be refused;
3. release `A`;
4. try `B` again without waiting. It must now succeed, and is released.

The operation returns two counts as a list: how many times in the 20 cycles `B`
got the lock while `A` held it, and how many times it got it after `A` was
released. Correct is `[0, 20]`.

This is a task on the file system (see "Tasks on the file system" in the
[shared methodology](../../README.md)). The harness creates three lock files in
the task's scratch directory before each adapter process starts: a plain one,
one whose path has a space and non-ASCII characters, and one four directories
deep. The files are empty, already exist, and are in the operating system's
cache. Nothing is written to them.

## What is checked

Each of the three cases must return exactly `[0, 20]`. An implementation that
takes no lock returns `[20, 20]`; one that never releases, or whose second
handle can never lock, returns `[0, 0]`; both fail. The check forgives nothing
else. The counts must be integers (a list of two numbers); a boolean is not
accepted.

## What the figure means

CPU time is the process's user and system time, and here most of it is the
kernel's: `open`, `flock` and `close` system calls, which every entry has to
make, so the classes are closer together than in a task on memory. The entries
differ by how many calls they make per cycle and by their own bookkeeping
(objects, exceptions, thread locks). Specifically:

- `locket` keeps one lock set per path in the process, with a thread lock in front of the flock, so its second handle is refused by the thread lock. That is the library's design.
- Handles are created in every cycle, as the packages document. Nothing is
  kept between cycles or calls.
- Python `filelock` and `portalocker` signal a refused non-blocking attempt by
  raising an exception; the others return a flag. The cost of raising is the
  library's own, so it counts.
- This is uncontended locking in one process: two handles of one process on
  one file. `flock` locks belong to the open file description, so a second
  handle of the same process is refused just as another process would be.
  Contention among several processes is not measured.

## Packages

- PyPI: `filelock`, `portalocker`, `locket`.
- Go: `github.com/gofrs/flock`, `github.com/alexflint/go-filemutex` (`TryLock`).
- Crates: `fs2` (`lock_exclusive`, `try_lock_exclusive`).
- Standard libraries: Python `fcntl.flock`, Ruby `File#flock`, Go
  `syscall.Flock`.

Left out:

- `fcntl` record locks (`fcntl.lockf`, POSIX `F_SETLK`): they belong to the
  process, so a second handle in the same process is not refused. Out of scope.
- Node.js and Bun have no file lock in their standard libraries, and the brief
  has no npm or JSR package that takes an advisory file lock (`proper-lockfile`
  locks with a directory and modification times, not with a lock on the file).
  There is no JavaScript entry.
- Rust's `File::lock` has no `builtin` path in the harness.
- Python `lockfile` (pylockfile) is deprecated and locks with hard links and
  unique files, not with a lock on the file.
- No RubyGems package in the brief; Ruby has the standard library entry only.
