# Byte count formatting

One operation takes a non-negative integer number of bytes and returns a short
human-readable string: a number followed by a unit, such as `1.5 MiB` or
`340KB`. The 56 cases run from 0 to about 2^52 bytes and include exact powers of
1024, values just below and above them, and many in-between sizes.

Units are binary: each step is a factor of 1024. Packages spell this differently
(`KB`, `kB`, `KiB`, with or without a space), and the checker accepts any of
those spellings. The checker reads the number and the unit, scales the number
back to bytes and requires it to be within 1% of the input (default rounding to
one or two decimals needs at most 0.5%). It also requires the largest unit that
keeps the number below 1024 (a rounded 1024.0 is tolerated), whole bytes without
decimals for sizes under 1024, and a plain number with `B` or no unit for them.
A wrong base (1000), a wrong unit or a truncated number fails.

Packages run with their default settings as installed. Where a library returns a
number and a prefix instead of a string, the adapter joins them into a string
inside the measured call, in every language alike. That is the case for
`number_prefix` (Rust): the crate only divides and picks the prefix, and the
string is produced by the adapter's own `format!` with one decimal, so its
figure is the crate's arithmetic plus formatting code the crate does not
contain. Parsing sizes back from text,
decimal (SI) formatting and locale-aware number formatting are outside the task.
`d3-format` is left out: its `s` type is decimal SI (factors of 1000), which is a
different output, not a spelling variant.

See [shared methodology](../../README.md) for timing and reproduction.
