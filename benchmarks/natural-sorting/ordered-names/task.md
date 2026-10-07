# Sorting names with numbers

One operation takes a list of 20 to 120 distinct strings and returns a new list
with the same strings in natural order: digit runs compare by numeric value
(`file2` before `file10`), everything else compares character by character,
and a string that is a prefix of another comes first. The input is never
changed; each adapter sorts a fresh copy of the list (a shallow copy, so no
string is duplicated) inside the measured call.

Inputs are built from lowercase ASCII letters, digits and `-`, such as
`img-12-v3`, `a10b2` and `report-2024-9`. Numbers have no leading zeros and
all strings in a list are distinct, so the correct order is unique. Case,
leading zeros, accents, other punctuation (`natural-compare` sorts `-` after `.`, unlike ASCII and ICU) and very long digit runs are out of
scope: packages differ on them, and so does locale collation. The expected
order comes from a reference comparator in `scenario.mjs` and is asserted
exactly.

Packages run with their default settings as installed. Where a package offers
only a comparison function, it is passed to the language's own sort; where it
offers a sort, that is used. The JavaScript built-in is `Intl.Collator` with
`numeric: true` (the one non-default option, since that is how it is asked to
order numbers); in this ASCII-only corpus it agrees with the reference.
The Python, Ruby and Go standard libraries have no natural ordering, and the
packages for those languages are not synchronous-task adapters yet.
See [shared methodology](../../README.md) for timing and reproduction.
