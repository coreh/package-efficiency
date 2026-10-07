# Character diff of two short strings

One operation takes two strings and returns their character differences: which
characters are in both, which are only in the first and which are only in the
second. Each string is a sentence, log line or short record of 20 to 200
characters. The cases are an old and a new version of the same text: a typo
fixed, a word replaced, words inserted or removed, several edits in one string,
a heavily rewritten string, with ASCII and non-ASCII (Latin accents and
Japanese, all in the Basic Multilingual Plane, so a character is one UTF-16 unit
and one code point), plus identical strings, strings with nothing in common, an
empty string on either side, both empty and one-character strings. This is the
second text-diff task; the first diffs whole lines of larger texts.

Every adapter returns the same shape: a list of `[op, count]` runs in text order,
where `op` is `"="` (characters in both), `"-"` (only in the first string) or
`"+"` (only in the second) and `count` is a number of characters. Libraries that
return text parts, edit lists or opcodes are mapped to this shape inside the
measured call, in every language. Every library is given the two strings and
splits them into characters itself (Rust `diff` through its own `diff::chars`).

A correct output must account for every character of both strings and keep as
many characters as the longest common subsequence of the two strings, the
default (minimal) result of an exact diff. The check computes that length
itself. What may differ, and is accepted as equivalent: which of several
equally long common subsequences is kept, how a changed block is split into
runs and whether removed characters come before added ones inside it. The
check compares only totals: the characters of each string accounted for and the
characters kept. Outputs that keep fewer characters than the longest common
subsequence, or that do not add up to the lengths of the two strings, fail.
Because only counts are compared, the check cannot tell which equally long
subsequence was kept.

Packages run with their default settings as installed. For
`@clearlylocal/diff-match-patch-unicode` the default is `Diff_Timeout = 1`
second, which turns on diff-match-patch's half-match shortcut; upstream
documents that shortcut as able to give a non-minimal diff. It keeps a longest
common subsequence on every fixture here (the check would fail otherwise), but
unlike the other entries the library does not promise one on other inputs. Not covered: line or
word diffs, unified patch text, edit-distance scores, semantic cleanup of the
result and assertion pretty-printers.

## Packages left out

- `difflib` (Rust) and Python `difflib` find matching blocks with a heuristic that does not give a longest common subsequence on characters, so they would fail the check by design.
- `jest-diff` returns a formatted, colored report for assertion messages, not a list of changes.
- `@libs/diff` (JSR) returns a unified patch string; getting runs from it would mean parsing text inside the measured call.
- `@coven/compare` (JSR) compares JavaScript values and objects, not text.

See [shared methodology](../../README.md) for timing and reproduction.
