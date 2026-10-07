# Parse .env text with variable references

One operation parses the text of a .env file whose values refer to earlier
assignments with `${NAME}` and returns a key-value map of strings in which every
reference has been replaced by the referenced value. The 36 inputs are built
deterministically, from 1 to 11 service groups (one input has 40), each group
with host, port, a derived address (`${HOST}:${PORT}`), a URL built
from that address (a reference to a reference), a directory built from a shared
root, a log path with two references, an unquoted value with a
trailing `# comment`, a `${HOST}_${REGION}` name, and double-quoted values with `#` and non-ASCII text (no references).

A correct output has exactly the expected keys and the fully expanded string
values: a result that still contains `${`, or the raw text, fails.

References only name keys defined earlier in the same text, and only appear in
unquoted values; the double-quoted values contain none. Single-quoted values, `$NAME` without braces,
defaults (`${NAME:-x}`), unset names, escapes and multi-line values are not used:
libraries disagree there, and some read the process environment. Loading into
the process environment is not part of the task.

Packages that parse without expanding on their own are used with their expansion
companion when it is the documented way: `dotenv` parses and `dotenv-expand`
expands the parsed map (given an empty target environment, so nothing is
written to `process.env`); both calls are timed. `dotenv-expand` is pinned
at 13.0.0, the last release that only substitutes references. Its next release,
numbered 1000.0.0 by its maintainer, also runs command substitutions and
decrypts values during expansion, which is a different job from this task's. `@std/dotenv` and
`dotenvy` expand while parsing. `dotenvy` looks each referenced name up in the
process environment before its own map; the other two are not given the
environment. Each adapter returns the library's own result: an object for the
JavaScript packages, the list of pairs for `dotenvy`. Node's `util.parseEnv` and `@next/env` (which only expands
while loading files) are left out. Packages run with default settings as installed.
See [shared methodology](../../README.md) for timing and reproduction.
