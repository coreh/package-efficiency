# Short string build, clone and compare

One operation takes two strings (slices of the fixture): a text and a second
string to compare it with. Most are ASCII of 1 to 40 bytes; some are longer
and some are not ASCII. It builds the library's
small-string type from the text, clones that value once, builds a second value
from the second string, and compares the clone with that second value. The call
returns the clone and the result of the comparison; the source and the second
value are dropped inside the call.

The 76 cases are mostly short ASCII, which is the task: every length from 1 to
40 bytes, plus 16 realistic strings (identifiers, locale tags, file names, HTTP
header names, short words and paths). Eight more are ASCII of 48 to 256 bytes
(generated text, a file path, a user-agent string, a sentence) and twelve are
not ASCII (accented Latin, Greek, Cyrillic, Japanese and emoji, 5 to 99 bytes
of UTF-8). In all, 64 of the 76 are at most 40 bytes, 14 fit in 8 bytes and 29
are longer than 24 bytes, the largest inline capacity among the entries, so
every type's inline and heap-backed representations are both exercised.

In half the cases the second string is the same text; in a quarter it differs
in its last character and in a quarter in its first, always at the same length
in bytes. The second value is built on its own and is never the clone's
source, so a type that compares pointers first (`smol_str` does for heap
strings) still has to compare bytes. The strings are preconstructed and
parsing is excluded.

A correct output holds the same text as the input, has the input's length in
bytes of UTF-8 and reports whether the two strings are equal. The verifier checks the text and
length of the clone (so a constant or a skipped build fails) and that the
comparison is true for the equal pairs and false for the others.
The Rust runner describes each result to JSON before warm-up; that step is not
timed. During measurement only the clone's length and the comparison result are
read.

One call is expected to cost somewhere between a few nanoseconds and a few
tens of nanoseconds, so the loop shared by every entry (indexing the fixture,
reading its two strings, the `Result` wrapper) is a visible share of each figure. Small differences between
entries should not be read closely.

Packages run with their default settings.

## Rust entries

- `compact_str`: `CompactString::new(s)`, `.clone()`, `==`. Up to 24 bytes inline, longer on the heap.
- `smol_str`: `SmolStr::new(s)`, `.clone()`, `==`. Up to 23 bytes inline; longer text is an `Arc<str>`, so its clone is a reference count bump.
- `tendril`: `StrTendril::from_slice(s)`, `.clone()`, `==`. Up to 8 bytes inline; longer text is heap-backed and shared on clone.

The types differ in size and in what a clone costs; that is the point of the
comparison. Every crate's result is mapped to the same JSON shape only in the
untimed describe step.

`tinystr` is not included: `TinyAsciiStr<N>` is a fixed-capacity ASCII array,
not a string type that can hold any text, so it cannot take the longer or
non-ASCII fixtures.

`string_cache`, which is in this category, has no adapter here. It is an
interning type: every distinct string goes into one table shared by the whole
process, which is a different job from building and cloning a value.
