# Transliterate titles to ASCII

One operation takes a title of about 80 characters and returns it with every
accented or non-Latin letter replaced by its closest ASCII spelling. The result
is a string. The 66 inputs mix words in Latin script with diacritics (French,
Spanish, Polish, Czech, Turkish, Nordic, Baltic), Cyrillic, Greek, and plain
ASCII words, digits and punctuation that must pass through unchanged. Slugs
(lower case, hyphens), Unicode normalization and case conversion are out of
scope; `slugify`-style packages do another job and are not entered.

## What counts as correct

The output must equal the scenario's own character table applied to the input,
exactly: no trailing spaces, no case change, no dropped characters. An input
returned unchanged, or one with accents stripped by NFKD alone, fails (the
scenario asserts this when it loads): `ß`, `ø`, `ð`, `þ`, `ł`, `đ`, `æ`, `œ`,
and all Cyrillic and Greek letters have no decomposition.

Packages do not agree on every character, and for those there is no single
right answer. The fixtures use only the letters on which every package that
transliterates the script gives the same text. The table was built by running
each package on every letter of Latin-1, Latin Extended-A, Cyrillic and Greek,
and keeping the letters with one common answer. Left out:

- Latin: `ä ö ü` (`@sindresorhus/transliterate` writes `ae oe ue`, German style),
  `Æ` (`Ae` or `AE`), `Œ`, `Ý` (`transliteration` gives `U`), `Þ` (`Th` or
  `TH`), `Ĳ ĳ ĸ ŉ Ŋ ŋ ſ Ŧ ŧ Ŀ ŀ` and similar rare letters.
- Cyrillic: `Е е` and `Г г` (`stringex` writes `ie`, `gh`), `Й`, `Х`, `Ц`, `Щ`,
  `Ю`, `Я`, `Ё` (`y` or `i`, `kh` or `h` or `x`, `ts` or `c` or `cz`, `iu` or `yu`,
  `ia` or `ya`, `io` or `yo` or `e`), and the signs `Ъ Ь`, which some drop.
- Greek: `Β β Η η Υ υ Φ φ Χ χ Ξ ξ` (`v` or `b`, `i` or `e`, `y` or `u`, `f` or
  `ph`, `ch` or `kh` or `x`, `x` or `ks`), `Θ`, `Ψ` capital forms.
- Characters outside letters: curly quotes, dashes, the euro sign.
- CJK, Arabic, Hebrew, Indic and Thai scripts: the packages give different
  romanizations, and some add spaces between syllables.

## Entries

- npm `transliteration`, `any-ascii`, `unidecode`, `@sindresorhus/transliterate`;
  crates `deunicode`, `any_ascii`, `unidecode`; PyPI `unidecode`,
  `text-unidecode`, `anyascii`; gems `babosa`, `stringex`; Go modules
  `mozillazg/go-unidecode`, `rainycape/unidecode`, `fiam/gounidecode`. Each is
  called as its documentation shows, with default options.
- `babosa` with default options transliterates only Latin letters, so it fails
  the Cyrillic and Greek fixtures and is recorded as not passing. The variant
  `babosa-all-scripts` passes `:cyrillic, :greek, :latin` to `transliterate`.
- No standard library does this job (Unicode normalization cannot turn `ß` or
  `ж` into ASCII), so there are no `builtin/` entries. JSR has no package for it.
- Left out: `sixarm_ruby_unaccent` (Latin accents only, with no option for
  other scripts), `slugify`, `limax`,
  `python-slugify`, `parameterize` (they produce slugs, a different job).

Packages carry tables of different size, which is measured as they are.
