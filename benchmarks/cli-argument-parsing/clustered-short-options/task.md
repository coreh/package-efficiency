# Clustered short options

One operation parses one argv array (program name and runtime flags already removed)
written in the compact Unix style, against a declared interface, and returns the
structured result:

- `-v`/`--verbose`, `-d`/`--dry-run`, `-f`/`--force`: boolean flags
- `-n`/`--name <text>`: a string
- `-c`/`--count <int>`: an integer
- `-t`/`--tag <text>`: a string that may repeat; values are kept in order
- any number of file operands, interleaved with options; `--` ends option parsing

What differs from the sibling task `mixed-options` is the spelling. The 48 cases use
grouped short flags (`-vdf`), a short option with its value attached (`-napp`, `-c42`,
`-tops`), a group whose last letter takes a value as the next argument (`-vdn web`) or
attached (`-vfc42`), alongside the long forms `--name x` and `--name=x`. Values include
spaces, non-ASCII text, dots and a zero count; operands after `--` look like flags; one
case is an empty argv. A correct result has `verbose`, `dry`, `force` (booleans), `name`
and `count` (`null` when absent), `tags` and `files` (arrays of strings, in argv order).
The check compares every field exactly.

Accepted differences: each package returns its own result shape (`_`, `dry-run` or
`dryRun`, and so on); the adapter maps it to the common shape inside the timed call with
a few property reads. Packages run with their default settings as installed, with options
declared the way each package's documentation shows. The declared parser (or option table)
is built once outside the timed call; every call parses a fresh argv.

Leaving out: `minimist`, `yargs-parser`, `@std/cli` and `arg` (a letter value attached to a
short option, `-napp`, is not split into the option and its value, or is rejected;
no setting changes that), and `@cliffy/flags` (does not split `-vdf` or `-napp` into
letters). Go `flag` and `pico-args` are out for the reasons given in `mixed-options`.

Every parser here is also in `mixed-options`, and the cost in both
tasks is per-argv parser overhead, so the ranking is expected to be close to that task's.
What this task adds is the list above: which packages cannot split clusters.

Not covered: subcommands, help and error output, negated flags (`--no-x`), negative numbers.

See [shared methodology](../../README.md) for timing and reproduction.
