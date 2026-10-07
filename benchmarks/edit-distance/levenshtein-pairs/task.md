# Levenshtein distance of string pairs

One operation takes a pair of strings and returns their Levenshtein distance:
the least number of single-character insertions, deletions and substitutions
that turns the first string into the second. The result is a non-negative integer.

The 48 cases are pairs of printable ASCII strings of 5 to 200 characters. They
include identical strings, one edit apart, light edits of prose-like text,
unrelated strings, strings of very different lengths and repetitive strings.
Every output must equal the distance from an independent dynamic-programming
oracle in `scenario.mjs`. There is no tolerance: the distance is exact.

Inputs are ASCII only, so a character is one UTF-16 code unit in JavaScript and
one scalar value in Rust, and the packages agree. Unicode normalisation and
grapheme handling are outside the task. Packages run with their default
settings as installed: `fast-levenshtein` without a locale collator, `leven`
and `strsim::levenshtein` with no options. Packages with a distance limit or
other metrics (Damerau, Jaro-Winkler) are not used here.

No result is cached between calls. Strings are created before timing. Each
language consumes the integer result directly.

See [shared methodology](../../README.md) for timing and reproduction.
