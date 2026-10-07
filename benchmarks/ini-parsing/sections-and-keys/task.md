# INI sections and keys

One operation parses an INI document held in memory as a string and returns
the parsed data. The 36 documents are 20 to 250 lines: `[section]` headers
(names with spaces, dots and non-ASCII letters), `key = value` and `key=value`
lines, blank lines, and full-line comments starting with `;` or `#`. Values
include paths, URLs, text with spaces, non-ASCII text, and values that contain
`=` or `:` after the first delimiter. Every key is lower-case and unique within
its section, and every key sits inside a section.

A correct output is an object mapping each section name to an object mapping
each key to its value as a string, with surrounding whitespace trimmed. Section
and key order is not compared. Values are always strings: the fixtures hold no
values that look like numbers, booleans or null. Objects must be plain objects
(dicts in Python).

Not covered: keys outside sections, duplicate keys or sections, quoted values,
backslash escapes, inline comments, continuation lines, interpolation (`%`),
CRLF line ends, `:` as the delimiter, and serialization.

Accepted differences: each package returns its own type (a plain object, an
`Ini` value, a `ConfigParser`). Each adapter returns what its package returns; where that is not the common
shape (Rust's `Ini`, Python's `ConfigParser`), it is converted for the verifier
once per fixture, outside the timed call. Packages run with their default settings, as installed.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- JSR: `@std/ini` `parse`.
- Rust: `rust-ini` `Ini::load_from_str`.
- Python standard library: `configparser.ConfigParser.read_string`.

No npm package in the category's top list was available for this task.
