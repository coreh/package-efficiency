# Brace expansion of zero-padded and descending ranges

One operation expands one brace pattern string into the list of strings it
stands for, in the order bash produces them (leftmost brace group varies slowest).
The 48 cases are dominated by numeric ranges rather than word lists: ascending
ranges with zero-padded endpoints (`{001..120}`), descending ranges (`{90..3}`),
descending padded ranges, short padded ranges (`{00..09}`), two ranges in one
pattern, and a range combined with a small comma list. Results are lists of
roughly 10 to 300 strings (a few are larger when two ranges multiply).
The check compares the whole list, in order, with an independent reference
expander, so padding width and direction must be exact.

Padding follows bash: when either endpoint has a leading zero, every number is
padded with zeros to the width of the longer endpoint. Inputs avoid steps,
alphabetic ranges, negative numbers, escapes and unbalanced braces. Packages run
with their default settings as installed. Each library's own list is the result;
nothing is serialized inside the measured call, and only the list length is read
during measurement.

This is string expansion, not glob matching or filesystem walking.

The crate bracoxide is left out because it does not expand descending ranges.
