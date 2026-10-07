# Quoted CSV records

One operation parses a CSV document held in memory as a string and returns all
its records. The 36 documents are 20 to 200 rows of 4 to 10 columns: ids,
names with Unicode, prices, dates, free text and addresses. About a quarter of
the fields are quoted. Quoted fields contain commas, doubled quotes (`""`),
embedded line breaks, leading or trailing spaces, or are empty (`""`); some
are quoted although they need not be. Every row has the same number of fields.
Line endings are `\n`, the last row ends with one, and there are no blank
lines, no byte order mark and no header handling: the first row is an ordinary
record.

A correct output is the list of rows, each a list of strings, equal to the
expected rows: same number of rows, same fields in order, quotes removed and
doubled quotes collapsed, line breaks kept inside quoted fields, empty fields
as empty strings. No type conversion is accepted: `"42"` stays a string.

Accepted differences: a Rust crate returns its own record type
(`csv::StringRecord`); the harness converts it to a list of strings once per
fixture before any measured work. Packages run with their default settings, as
installed (comma delimiter, double quote, strict quoting).

Not included: `@vslinko/csv` (streaming and asynchronous, so not a synchronous
call) and `csv-core` (a bare state machine that leaves record assembly to the
caller). Writing CSV is out of scope here.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- JSR: `@std/csv` `parse`.
- Rust: `csv` `Reader` with `has_headers(false)`, collecting `StringRecord`s.
- Standard library: Python `csv.reader`, Ruby `CSV.parse`, Go `encoding/csv` `ReadAll`.
