# Find an executable on a given PATH

One operation is given a PATH (absolute directory paths joined with `:`) and a
list of 40 command names. For each name it looks in the PATH's directories in
order and finds the first `<directory>/<name>` that is a regular file, after
following symbolic links, that the process may execute. It returns a list with
one entry per name, in the same order: the path found, or null when no
directory holds one. This is what the shell's `command -v` and `which` do.

This is a task on the file system (see "Tasks on the file system" in the
[shared methodology](../../README.md)). The directories are real. The harness
creates them in the task's scratch directory before each adapter process
starts, and each call looks every name up again: nothing may be remembered
from one call to the next.

The tree has 670 regular files (653 with mode 755 or 700, 17 with mode 644 or
600), 72 symbolic links and 178 directories: system directories of 20 to 300
programs, a Homebrew-style `bin` of links into versioned package directories,
a dot directory of user scripts (a third of them never made executable),
`node_modules/.bin` links (one to a script that is not executable), a tool
directory reached through a link to its current version, and directories with
a space and a non-ASCII character in their names. There are four PATHs, and a
round covers each the same number of times:

- A developer's PATH of 8 directories: user directories, Homebrew, then the
  system. Programs found in each of them, names present in several (the first
  executable one wins; `python3` is first a non-executable file), 4 misses.
- A long PATH of 16 directories, among them one that does not exist, a
  regular file, a directory reached through a link, a directory named twice,
  and the space and non-ASCII directories. 14 names are not found.
- A PATH that starts with a directory of traps, each a name that is not an
  executable file there, while a later directory holds the program: a file of
  mode 644, a file of mode 600, a directory, a broken link, a link to a
  non-executable file, a link to a directory, and two links that point at
  each other. In the same directory a two-link chain to a program of mode 700
  and a program of mode 700 are found there; a directory and a plain file
  with no program behind them give null.
- A PATH of 12 directories and unusual names: `g++`, `python3.12`,
  `x86_64-linux-gnu-gcc`, `.hidden-tool`, `my tool`, `café`, `[`, `a`, a
  name that is only a directory, and 20 names found nowhere.

Every program a name finds has the execute bit for its owner (the process's
user) and the same answer for group and others, so a check by permission bits
and the system's `access(X_OK)` agree. No PATH has an empty entry, `.`, `..`,
a relative directory, a trailing slash or quotes, and no name holds a `/`;
those are handled differently from one package to another and are not part
of the job here. No name differs from a file only in letter case, since the
file system of the published results ignores case.

## What is checked

The list must have one entry per name, in order. Each found entry must be
exactly the PATH directory joined to the name with one `/`
(`<scratch>/opt/homebrew/bin/git`), not the target of a link
(`<scratch>/opt/homebrew/Cellar/git/9.9/bin/git`), and each miss must be null.
Returning a file that is not executable, a directory, a later match than the
first, a resolved path, or nothing fails; the scenario asserts each of these
at load. Nothing is forgiven. A package that reports a miss by throwing or by
`undefined` has its adapter turn that into null inside the measured call, in
every language alike.

## What the figure means

The tree was written a moment before and is in the operating system's cache,
for every entry alike, so no disk is read. CPU time is the process's user and
system time. The system part is the kernel answering `stat` and `access`
calls; how many a package makes per candidate (one `stat` read for mode and
owner, or `stat` and `access`, or Python's three) is its own choice and is
counted, which is why classes are closer together here than in a task on
memory. The time depends on the operating system and file system (macOS and
APFS for the published results).

Every entry is given the PATH as a string in its documented option (`path`,
`PATH`, the paths argument). Go's `exec.LookPath` has none: it reads the
environment, so its adapter sets `PATH` with `os.Setenv` at the start of each
call, inside the measured work. The environment's own `PATH` is never used by
any entry.

## Packages

- npm: `which` (`which.sync(name, { path, nothrow: true })`).
- JSR: `@david/which` (`whichSync(name, environment)` with an environment
  whose `env("PATH")` returns the given PATH).
- Rust: `which` (`which::which_in(name, Some(path), cwd)`).
- Standard libraries: Python `shutil.which(name, path=path)`, Go
  `exec.LookPath` after `os.Setenv("PATH", path)`, Bun `Bun.which(name,
  { PATH: path })`.

`@david/which` checks only that the candidate is a file, not that it may be
executed, so on this task it returns non-executable files (`python3` in the
first PATH) and is expected to be recorded as not passing; the fixtures are
not changed for it, because every other entry agrees with POSIX `which`.

## Left out

- Node and Deno have no function that looks a command up on a PATH. Ruby's
  standard library has none either: `MakeMakefile#find_executable` (mkmf)
  writes a log file and messages as it searches, and is a build tool's helper,
  not a lookup.
- Files executable by group or others but not by their owner: `which` (npm)
  judges by permission bits and accepts them, the system's `access(X_OK)`
  refuses them. The packages split on it and it is marginal, so no fixture
  has one.
- The nearest-file walk of `nearest-package-json` is another job: `which` was
  first filed beside it and belongs here.
