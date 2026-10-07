# Terminal display width

One operation takes a string and returns the number of terminal columns it
occupies, as a non-negative integer. The 61 cases mix ASCII, Latin letters with
precomposed accents, Cyrillic and Greek, Japanese kana and kanji, Chinese,
Korean Hangul, fullwidth forms and single-code-point emoji, in varied lengths,
plus the empty string. Wide (East Asian Wide and Fullwidth) characters and
emoji count as two columns, everything else in the fixtures as one.

Expected widths come from an independent per-character oracle in
`scenario.mjs`. Fixtures deliberately avoid cases where the packages legitimately
disagree: control characters, ANSI escape sequences, combining marks, zero-width
joiners and emoji sequences, variation selectors and East Asian Ambiguous
characters. Packages run with their default settings as installed.

Every entry measures a whole string with the package's own function.
`get-east-asian-width`, which classifies one code point and is what
`string-width` is built on, is left out: timing it would time a loop written
for this task.

Wrapping, truncating and stripping styled text are outside the task.
See [shared methodology](../../README.md) for timing and reproduction.
