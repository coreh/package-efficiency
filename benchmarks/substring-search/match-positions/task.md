# Literal match positions

One operation takes `{ text, needle }`: an ASCII text of 2 to 128 KB and one
non-empty literal string. It returns the list of start offsets (integers,
ascending) of every occurrence of the needle. The existing `literal-counts` task
only counts and builds many small searches; this one produces the positions,
on larger texts, for one needle at a time.

The 48 cases are deterministic word-salad texts (log-like, prose-like and header-like)
with eight needle shapes per kind: one byte (a newline), two bytes, a short word,
a 12-byte literal, a 20-25 byte phrase that is rare, a word, a literal that
never occurs, and a short literal ending in a space. Match counts range from 0 to several thousand.
Outputs must equal an independent oracle that tests every start position, so
a count, a constant or an unchanged input fails.

Rules:

- Matches are literal and case-sensitive. The text is ASCII, so byte and character offsets agree in every language.
- Needles never overlap themselves (no proper prefix equals a suffix), so overlapping and non-overlapping
  iteration give identical positions.
- The needle changes with every call, so any searcher (a `Finder`, an automaton) is built inside the call, in
  every adapter alike; nothing is cached between calls.
- Packages run with default settings as installed.
- The result is a plain list of integers in every language; consuming it reads its length.

## Entries

- `memchr` (Rust): `memmem::find_iter` for every needle (one-byte needles included; the adapter does not pick a function by needle length), collecting start offsets.
- `aho-corasick` (Rust): `AhoCorasick::new([needle])` and `find_iter`, collecting starts. A single-pattern automaton is built every call.
- Standard libraries: JavaScript `indexOf` loop, Python `str.find` loop, Ruby `String#index` loop, Go `strings.Index` loop.

`bytecount` only counts one byte and returns no positions, so it is left out.
