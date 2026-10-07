# Literal occurrence counts

One operation takes `{ text, needles }`: an ASCII text of 1 to 48 KB and a list
of one or more non-empty literal strings. It returns a list of integers, one per
needle, in the same order: how many times that needle occurs in the text.

The 48 cases are deterministic word-salad texts (log-like, prose-like and header-like)
with three kinds of search: 12 cases with a single one-byte needle, 12 with a
single 12-byte literal, and 24 with a set of 4 to 20 distinct literals, some of
which contain one another (for example `he` and `the`). So half of the cases
have one needle and half have several.
Outputs must equal an independent oracle that scans every start position.

Rules:

- Matches are literal and case-sensitive; no regular expressions, no Unicode
  normalization. Text is ASCII, so byte and character offsets agree in every language.
- Counting each needle independently is the contract. Needles contained in other
  needles are all counted. Needles are chosen so that none overlaps itself
  (no proper prefix equal to a suffix), which makes overlapping and
  non-overlapping counting of one needle identical; libraries of either kind are
  therefore equivalent here.
- Packages run with default settings as installed. Matchers or automata are built
  inside the call; nothing is cached between calls.
- The result is a plain list of counts in every language; consuming it reads its length.

## Entries

- `memchr` (Rust): `memchr_iter` for one-byte needles, `memmem::find_iter` per needle otherwise.
- `aho-corasick` (Rust): `AhoCorasick::new(needles)` and `find_overlapping_iter`, one pass, tallying by pattern.
  Its figure includes building the automaton on every call, as the rule above requires, also in the 24
  single-needle cases, where a multi-pattern automaton has no advantage over a plain substring search.
- Standard libraries: JavaScript `indexOf` loop, Python `str.count`, Ruby `String#index` loop, Go `strings.Count`.

`bytecount` only counts one byte and cannot do the multi-literal cases, so it is left out.
