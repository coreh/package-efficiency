# TOML validity: accepting and rejecting documents

One operation takes a TOML document held in memory as a string, parses it with
the library's normal parse call and answers a boolean: `true` if the library
accepted the document, `false` if it raised an error. The parsed tree is
discarded; what is measured is the full parse of valid input and the cost of
detecting and reporting an error in malformed input (building an exception or
error value included, as real code that handles bad input does).

There are 42 documents: 13 valid and 29 malformed. They are service settings
documents of 1 to 12 routes (generated, 34 of them), one lockfile of 30
packages (about 190 lines) in a valid and a broken variant, and a few short
hand-written ones. The malformed ones carry one defect each: a table defined
twice, an unterminated basic or literal string or multi-line string, a leading
zero in an integer, a doubled underscore, an unclosed array or table header, an
invalid escape, a missing key or value, two values on one line, or a bare word
that is not a value. Among the 24 malformed settings documents the defect is at
the start in 10 (the parser can stop at once), before a table header near the
middle in 8, and at the end in 6 (the whole document is read first). The broken
lockfile ends with an unclosed `[[package` header.

Most of the bytes are still read by the ordinary parsing path: the valid
documents, and everything before a defect in the middle or at the end. The
settings and lockfile generators and the five adapters' parse calls are the
same as in `toml-parsing/documents`, so the two tasks are expected to rank the
packages similarly; what this one adds is the early exits and the cost of
building and reporting an error. The lockfile is kept small (about a fifth of
the bytes) so that it does not decide the figure.

A correct output is exactly `true` for each valid document and exactly `false`
for each malformed one, so a library that accepts everything, rejects
everything, or returns something else fails the check.

Duplicate keys (`a = 1` then `a = 2`) are not used as a defect: `@std/toml`
silently keeps the last value instead of rejecting them, while the other
libraries reject them. The fixtures use only defects every listed library
reports. Packages run with their default settings, as installed.

Inputs are preconstructed strings. This is parsing only: no serialization, no
schema validation, no editing.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- JSR: `@std/toml` `parse`, wrapped in try/catch.
- Rust: `toml` `from_str::<toml::Table>` and `toml_edit` `DocumentMut` parse,
  each followed by `is_ok()`.
- Built in: `Bun.TOML.parse` (Bun, try/catch), Python `tomllib.loads`
  (catching `TOMLDecodeError`).
