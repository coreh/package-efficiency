# Run a command and collect its output, awaited

The asynchronous form of [spawn-collect](../spawn-collect/task.md): the same
8 fixtures and the same check, through each library's awaited API instead of
its synchronous one.

One operation starts a small program with a list of arguments, awaits it,
and returns `{ stdout, status }`: everything it printed, as text, and its
exit status. The program is `/bin/echo`, given by its absolute path, so no
system shell is involved and nothing is looked up on `PATH`. It is the same
few kilobytes of native code on macOS and Linux and exits at once.

The 8 cases pass 1 to 40 arguments (5 bytes to about 1 kB of output),
including spaces, quotes, `$HOME`, `*`, a backslash, a tab, an empty string
and non-ASCII text, which must arrive untouched. A correct result has status 0
and the arguments joined by spaces. Libraries differ on whether the output's
final newline is kept (`execa` strips it by default); both are accepted.
Everything else is compared exactly, so an argument split, expanded by a
shell, re-encoded, or an output trimmed of more than its final newline (the
fourth case ends with an empty argument, so its output ends in a space) fails.
The scenario writes the fixtures out again rather than importing them, because
a scenario is loaded alone beside each adapter; the two must be kept the
same.

## What is measured, and what is not

This is an asynchronous task on **one thread** (`load.threads` is 1) with one
child at a time (`load.concurrency` is 1): the runner awaits each operation
before it starts the next. The operation creates nothing ahead of time; the
command object, the child and its pipe are all made inside the measured call.

- **CPU** is the caller's user and system time per operation, every thread of
  the calling process included: the library's own work, the event loop or
  executor that waits for the child's exit and reads its pipe, and the
  kernel's work on its behalf to create the child, read the pipe and collect
  the exit status. Where a runtime or library learns of the child's exit on a
  helper thread of its own (Python's asyncio on macOS, a reaper thread in some
  Rust crates), that thread is part of the figure: it is how the API does the
  job.
- **The child's CPU and memory are not counted**, on purpose, as in
  spawn-collect. The child is the same program in every entry, so its cost is
  a constant that would only blur the differences between libraries, and it
  is not the library's doing. Every runner reads its own process's CPU time,
  which leaves children out.
- **Waiting is not CPU.** An operation takes about a millisecond of elapsed
  time, most of it waiting for the child. Rounds are timed by the clock, so
  each round holds a few hundred operations; the round time is doubled to
  500 ms, as in spawn-collect, to steady the figures. No timer or sleep is
  involved anywhere: the operation ends when the child's exit is reported.
- Memory is the caller's, after the rounds, as in every task.

Set beside spawn-collect, the figures show what the awaited form costs over
the blocking one: the event loop's or executor's machinery for watching a
pipe and a child's exit, in place of a call that blocks until both are done.

Executors, as recorded with each result:

- JavaScript: the runtime's own event loop.
- Python: one `asyncio` event loop for the whole run.
- Rust `tokio`: a current-thread runtime (`process` feature).
- Rust `async-process`: `async_io::block_on`, which drives the `async-io`
  reactor the crate is built on from the calling thread.

## Packages

- `execa`: `await execa(command, args)`, default options; `stdout` and
  `exitCode` from the result.
- `tinyexec`: `await x(command, args)`, default options; `stdout` and
  `exitCode` from the result.
- `@david/dax` (JSR): `` await $`${command} ${args}`.stdout('piped') ``, with
  the arguments interpolated as an array so dax escapes each one; `stdout`
  and `code` from the result. dax parses the command line with its own
  cross-platform shell (written in TypeScript, not the system's), and that
  parsing is part of its figure: it is how the package is used.
- `@david/shell` (JSR): the same through its own `$`. It is the command
  runner and shell parser that dax is built on, published on its own for
  those who want only that layer; the two figures are expected to be close,
  and the difference is what dax adds.
- `tokio` (Rust): `tokio::process::Command::new(command).args(args).output().await`.
- `async-process` (Rust): `Command::new(command).args(args).output().await`.
- Standard library: `util.promisify(child_process.execFile)` on Node, Bun and
  Deno (the exit code from the promise's `child`); Python
  `asyncio.create_subprocess_exec(..., stdout=PIPE)` and `communicate()`.

## Left out

- Go `os/exec` and Ruby `Open3`: neither standard library has an awaited
  form. Their call blocks the calling thread, which is the synchronous task;
  an entry here would be the same code as in spawn-collect.
- `cross-spawn`'s `spawn` and `node:child_process` `spawn`: event-emitter
  APIs. The adapter would have to collect the output stream and build the
  promise itself, which is the work `execFile` and the packages above do.
- `@libs/run` and `@hugojosefson/run-simple` (JSR): they use `Deno.Command`
  and run only on Deno; a task here runs on Node, Bun and Deno.
- Commands that fail (libraries differ on whether a non-zero status rejects),
  large outputs, standard input, a system shell, signals and time-outs, as in
  spawn-collect. Several children at once would be another task.

See [shared methodology](../../README.md) for timing and reproduction.
