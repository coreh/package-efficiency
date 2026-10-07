# Line diff of two texts

One operation takes two texts and returns the line differences between them:
which lines are in both, which are only in the first and which are only in the
second. Each text is a string of 10 to 120 lines, every line ending in a newline.
The 41 cases differ by about 1%, 10% and 50% of their lines (lines replaced,
removed or added, with ASCII and non-ASCII text), plus identical texts, texts
with nothing in common, an empty text on either side, both empty, and one-line
texts. The inputs are small on purpose: the harness calls the operation many
thousands of times, so a 10,000-line diff cannot be measured this way.

Every adapter returns the same shape: a list of `[op, count]` runs in text order,
where `op` is `"="` (lines in both), `"-"` (only in the first text) or `"+"`
(only in the second). Libraries that report differences in another form (parts
with flags, edit operations, opcodes, text chunks) are mapped to this shape
inside the measured call, in every language. Splitting the texts into lines
is also done inside the call when the library takes lists of lines.

A correct output must account for every line of both texts and keep exactly the
lines the two texts share as a longest common subsequence. Every base line in
a case is unique, so that set of kept lines is the same for every correct
algorithm. What may differ, and is accepted as equivalent: how a changed block
is split into runs and whether removed lines come before added ones within it
(a replaced line may be reported as `-` then `+`, or `+` then `-`, or as several
runs). The check normalizes each changed block to its totals of removed and
added lines. Outputs that keep fewer lines than the longest common subsequence,
or that do not add up to the line counts of the two texts, fail.

Packages run with their default settings as installed. Not covered: character or
word diffs, unified patch text, edit-distance scores, structured value or JSON
diffs and assertion pretty-printers.

## Packages left out

- `jest-diff` returns a formatted, colored report for assertion messages, not a list of changes.
- `@libs/diff` (JSR) returns a unified patch string; getting runs from it would mean parsing text inside the measured call.
- `@coven/compare` (JSR) compares JavaScript values and objects, not text lines.

See [shared methodology](../../README.md) for timing and reproduction.
