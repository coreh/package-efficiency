# Unicode normalization forms

One operation takes a pair `[form, text]`, where form is one of `NFC`, `NFD`,
`NFKC` or `NFKD`, and returns the text normalized to that form. The 49 cases
cover each form on twelve texts and an empty string: plain ASCII, precomposed
Latin letters, text already decomposed, ligatures and circled or superscript
characters (which only the compatibility forms change), the Angstrom sign,
Hangul syllables (algorithmic composition and decomposition), half-width
katakana, and combining marks in non-canonical order. Lengths vary from a few
characters to several hundred.

A correct output is the exact string defined by Unicode Standard Annex #15.
Expected values are not computed by a library: each sample has its four results
written out by hand from the Unicode data, and a case's expectation is those
pieces joined with ASCII spaces. Outputs are compared code point for code point,
so no differences between packages are accepted; the sample characters are
stable across all recent Unicode versions.

Packages run with their default settings as installed. Inputs are strings made
beforehand. Case folding, transliteration and stringprep are outside the task.
Rust crates return their own string type (`unicode-normalization` builds a
`String` from an iterator; `icu_normalizer` returns a `Cow` that borrows the
input when it is already normalized); a borrowed result is not copied, as with
JavaScript, Python and Ruby, which may return the same string. No result is
cached between calls.

The standard-library adapters (JavaScript `String.prototype.normalize`, Python
`unicodedata.normalize`, Ruby `String#unicode_normalize`) are baselines. Go's
standard library has no normalization, and no npm or JSR package in the
category list offers it, so only crates.io packages are included.

See [shared methodology](../../README.md) for timing and reproduction.
