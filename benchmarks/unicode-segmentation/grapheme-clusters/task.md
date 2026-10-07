# Grapheme cluster splitting

One operation splits a string into its extended grapheme clusters (Unicode
UAX #29), the user-perceived characters, and returns them as a list of strings.

The 48 inputs are multilingual text of 4 to 1,000 clusters: Latin with
precomposed and combining accents, CJK, Japanese kana with combining marks,
Hangul syllables and conjoining jamo, Thai, Devanagari vowel signs, Arabic with
diacritics, emoji (skin tones, ZWJ families and professions, flags, keycaps,
variation selectors), CRLF, and a mixed pool. Each input is built by joining a
known list of clusters, so the expected result is that list; the check
compares every cluster and fails an adapter that returns the text whole, one
code point or one UTF-16 unit at a time, or any other split. Only clusters
that segment the same in every Unicode version since 11 are used (no Indic
conjunct sequences, which changed in 15.1), so runtimes with different
Unicode data agree.

Every adapter returns a list of cluster strings. Building that list is part of
the measured call. The Rust crate's iterator borrows from the input, so its
adapter keeps each cluster's byte length (nothing is copied out of the input
in measured work) and the verifier slices the input with them, outside timing.
Packages run with their default settings. `Intl.Segmenter` is created once,
outside the measured call; it keeps no result cache.

Left out: `@hugoalh/string-dissect` (a splitter into words, URLs, emoji and ANSI
codes that keeps words whole by default, not a grapheme splitter),
`unicode-linebreak` (line-break opportunities only). Python and Go have no
standard-library grapheme segmentation. The brief lists no npm packages.
