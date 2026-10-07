# Terminal width with combining and zero-width characters

One operation takes a string and returns the number of terminal columns it
occupies, as a non-negative integer. Unlike `display-width`, every fixture
contains characters that take no column: combining diacritics (decomposed
accented Latin, Cyrillic and Greek letters), Hebrew points, Arabic
vowel marks, Thai above and below vowels and tone marks, Japanese voiced-sound
combining marks, and zero-width characters (zero width space, non-joiner,
word joiner, byte order mark). They are mixed with ASCII, kana, kanji, Hangul
and fullwidth forms. Wide characters count as two, base letters as one, and
combining or zero-width characters as zero. 60 varied strings plus the empty
string.

Expected widths come from an independent oracle in `scenario.mjs` using Unicode
categories (Mn, Me, Cf count zero) and a table of wide ranges. A package that
counts every code point fails. Fixtures avoid spacing combining marks (category
Mc), joiner emoji sequences, ANSI escapes, control characters and East Asian
Ambiguous characters, where packages legitimately differ. Packages run with
their default settings as installed.

`eastasianwidth` and `get-east-asian-width` classify single characters only
and do not know combining marks, so they are left out. The `unicode-display-width`
crate, which is in `display-width`, is left out too: version 0.3.0 counts the
zero-width space, non-joiner, word joiner and byte order mark as one column
each, so it gives a different width for 24 of the 61 fixtures. That leaves
`string-width` (npm) and `unicode-width` (cargo), one per language. Wrapping, truncating and
stripping styled text are outside the task.
See [shared methodology](../../README.md) for timing and reproduction.
