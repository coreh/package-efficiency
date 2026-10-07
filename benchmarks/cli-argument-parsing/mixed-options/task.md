# Flags, options and positionals

One operation parses one argv array (program name and runtime flags already removed)
against a declared interface and returns the structured result:

- `-v`, `--verbose` and `-d`, `--dry-run`: boolean flags
- `-n`, `--name <text>`: a string
- `-c`, `--count <int>`: an integer
- `-t`, `--tag <text>`: a string that may repeat; values are kept in order
- any number of file operands, which may appear before, between or after options;
  `--` ends option parsing and everything after it is an operand

The 48 cases vary the spelling (`--name x`, `--name=x`, `-n x`), the order of options
and operands, the number of tags and files, values with spaces and non-ASCII text,
operands that look like flags after `--`, and an empty argv. A correct result has
`verbose`, `dry` (booleans), `name` and `count` (`null` when absent), `tags` and
`files` (arrays of strings). The check compares every field exactly.

Accepted differences: the declared interface is the same everywhere, but each package
returns its own result shape (for example `_` for operands, `dry-run` or `dryRun`,
repeated options as a string or an array). The adapter maps that shape to the common
one inside the timed call; the mapping is a few property reads. Every adapter,
in every language, returns the common shape as a value (object, dict, hash or
struct); converting a native result to JSON for the verifier is outside the timed call. Packages run
with their default settings as installed, with options declared the way each package's
documentation shows. The declared parser (or option table) is built once, outside the
timed call, wherever the package lets it be reused across parses; every call parses a fresh argv.

Not covered: subcommands, help and error output, grouped short flags (`-vd`),
negated flags (`--no-x`), negative numbers, and numeric-looking operands (several
packages convert those to numbers by default).

Leaving out: Go `flag` (stops at the first operand, so interleaved operands do not
parse) and `pico-args` (does not treat `--` as the end of options, and needs a
non-default feature for `--name=value`).

See [shared methodology](../../README.md) for timing and reproduction.
