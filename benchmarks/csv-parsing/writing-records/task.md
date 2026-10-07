# Writing CSV records

One operation takes a table, a list of rows each a list of string fields, and
returns it as CSV text (the Rust entry returns the UTF-8 bytes its writer
produced, without a pass to check them). The 36 tables are 20 to 200 rows of 4 to 10 columns:
ids, names with Unicode, prices, dates, free text and addresses. Many fields
need quoting: they contain commas, double quotes, embedded line breaks, leading
or trailing spaces, or are empty. Every row has the same number of fields, and
every field is already a string, so no type conversion is involved.

A correct output is a string that a strict CSV reader (comma delimiter, double
quote, quoted fields may contain line breaks and doubled quotes) reads back as
exactly the input table: same rows, same fields in order, no field changed,
empty fields as empty strings. The verifier does the reading with its own
reference parser and compares, so an output that merely echoes the input,
ignores quoting, drops rows or alters a field fails.

Accepted differences: the line terminator may be `\n` or `\r\n` (the default
differs between libraries), the last row may or may not end with one, and a
library may quote more or fewer fields than another as long as the text reads
back to the same table (some quote empty fields or fields with edge spaces,
some do not). Packages run with their default settings, as installed.

Per-call setup is part of the measured work in every entry: each call creates a
fresh writer and output buffer. The inputs are decoded JSON; Go copies each
row's fields into a `[]string` because its writer takes that type, while the
other entries pass the rows on directly or borrow them.

Not included: `@vslinko/csv` (streaming and asynchronous, so not a synchronous
call) and `csv-core` (a bare state machine whose writer leaves buffering and
record assembly to the caller). Reading CSV is the other task in this category.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- JSR: `@std/csv` `stringify`.
- Rust: `csv` `Writer` over a `Vec<u8>`, `write_record` per row.
- Standard library: Python `csv.writer().writerows`, Ruby `CSV.generate`, Go `encoding/csv` `Writer`.
