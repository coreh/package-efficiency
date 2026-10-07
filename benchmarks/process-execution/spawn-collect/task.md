# Run a command and collect its output

One operation starts a small program with a list of arguments, waits for it to
finish, and returns `{ stdout, status }`: everything it printed, as text, and
its exit status. The program is `/bin/echo`, given by its absolute path, so no
shell is involved and nothing is looked up on `PATH`. It is the same few
kilobytes of native code on macOS and Linux and exits at once.

The 8 cases pass 1 to 40 arguments (5 bytes to about 1 kB of output),
including spaces, quotes, `$HOME`, `*`, a backslash, a tab, an empty string
and non-ASCII text, which must arrive untouched. A correct result has status 0
and the arguments joined by spaces. Libraries differ on whether the output's
final newline is kept (`execa` strips it by default); both are accepted.
Everything else is compared exactly, so an argument split, expanded by a shell
or re-encoded fails.

## What is measured, and what is not

This is the existing synchronous kind of task, with adapters that call the
synchronous form of each library. The figures are those of the calling process:

- **CPU** is the caller's user and system time per call: the library's own
  work, and the kernel's work on its behalf to create the child (fork or
  spawn), read the pipe and collect the exit status.
- **The child's CPU and memory are not counted**, on purpose. The child is the
  same program in every entry, so its cost is a constant that would only blur
  the differences between libraries, and it is not the library's doing. Every
  runner already reads its own process's CPU time (`RUSAGE_SELF`,
  `process.cpuUsage()`, `time.process_time()`), which leaves children out; no
  harness change was needed.
- **Waiting is not CPU.** A call takes about a millisecond of elapsed time,
  most of it waiting for the child. Rounds are timed by the clock, so each
  round holds a few hundred calls instead of tens of thousands; the round time
  is doubled to 500 ms for this task to steady the figures.
- Memory is the caller's, after the rounds, as in every task.

What differs between runtimes is real and part of the comparison: how the
child is created (`posix_spawn`, `vfork`, `fork`), and how much of the
caller's address space the kernel has to deal with to do it.

## Packages

- `cross-spawn`: `spawn.sync(command, args, { encoding: 'utf8' })`.
- `execa`: `execaSync(command, args)`, default options.
- `tinyexec`: `xSync(command, args)`, default options.
- `duct` (Rust): `cmd(command, args).stdout_capture().run()`.
- Standard library: `node:child_process` `spawnSync` (on Node, Bun and Deno),
  Python `subprocess.run(..., capture_output=True, text=True)`, Ruby
  `Open3.capture2`, Go `exec.Command(...).Output()`.

Not covered: the asynchronous forms (`execa`, `tinyexec` `x`, `@david/dax`,
`cross-spawn`'s `spawn`), which are what most programs use and belong to the
asynchronous task kind, where the same fixtures and check apply; commands that
fail (libraries differ on whether a non-zero status throws); large outputs,
standard input, a shell, signals and time-outs. `foreground-child` hands the
terminal to the child and exits with it, and `run-applescript` runs only on
macOS; neither does this job.

See [shared methodology](../../README.md) for timing and reproduction.
