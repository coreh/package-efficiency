# TOML document parsing

One operation parses a TOML document held in memory as a string and returns
the parsed data. There are 40 documents: 36 small and medium ones (package
manifests, service settings, route tables, feature flags, Unicode text, strings
with escapes) and four lockfiles, the largest about 5,000 lines of
`[[package]]` tables. They use basic and literal strings, multi-line strings,
integers (decimal and hexadecimal, with underscores), floats, booleans,
arrays, inline tables, dotted keys, nested tables, arrays of tables and
comments. Escapes are limited to `\n \t \" \\ \uXXXX`; the eight-digit `\UXXXXXXXX` escape is left out because `@std/toml` decodes it wrongly for characters beyond the Basic Multilingual Plane (such emoji appear only as literal text). They use no date or time values, no infinities or NaN and no
integers beyond 2^53, because libraries and languages represent those
differently. Packages run with their default settings, as installed.

A correct output is a value deeply equal to the expected tree: same keys, same
tables and arrays, same strings, booleans and numbers (key order is not
compared). Integers and floats are only told apart by value: all floats in the
fixtures are non-integral (such as `0.5`), so every common representation agrees.
Tables must be objects (null-prototype objects are accepted and compared as
plain ones) and arrays must be arrays. Syntax trees and document
objects are accepted only where the library's normal parse result is that
type, and the check converts them to JSON outside the timed call.

This is parsing only: no serialization, no schema validation, no editing.
Inputs are preconstructed strings.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- JSR: `@std/toml` `parse`.
- Rust: `toml` `from_str` into `toml::Table`, `toml_edit` `DocumentMut` parse
  (format-preserving; the parsed document is what it returns).
- Built in: `Bun.TOML.parse` (Bun), Python `tomllib.loads`.
