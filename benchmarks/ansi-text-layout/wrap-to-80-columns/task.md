# Word-wrapping styled text to 80 columns

One operation takes a paragraph of terminal text on a single line, with ANSI SGR color
codes (basic, bright, bold, underline, 256-color, truecolor, resets) between some words,
and returns it word-wrapped to 80 visible columns, as one string with `\n` between lines.
The 40 cases are paragraphs of about 90 to 900 visible characters made of ASCII and
accented Latin words (1 to 14 characters, so no word is wider than a line), separated by
single spaces (no slashes or hyphens, where `textwrap` may break a word by Unicode line-break rules and `wrap-ansi` does not). Wrapping is the only operation; stripping, slicing and width measurement
are separate tasks.

The escape codes must not count toward the width, so a package that counts them fails.
Packages are allowed to differ in what they do with the codes at a break: `wrap-ansi`
closes open styles at the end of a line and reopens them on the next, `textwrap` leaves
the codes where they were. They also differ in the algorithm: `wrap-ansi` is greedy,
`textwrap` by default picks breaks with its optimal-fit algorithm, so breaks may fall in
different places. The check therefore does not compare against one exact string. It
requires, for the output: after removing escape codes, every line is at most 80 columns
and not empty; the lines joined with single spaces give back the original visible text
exactly (no word lost, changed, split or reordered); the number of lines is at least the
minimum possible and at most one more than a greedy wrap gives; and no escape code was
dropped (the output has at least as many ESC characters as the input). An adapter that
returns its input, a constant, or does not wrap fails.

All packages run with default settings as installed. `wrap-ansi` is called as
`wrapAnsi(text, 80)` and `textwrap` as `textwrap::fill(text, 80)`; its default features
(Unicode width, which skips ANSI sequences) are used. Both return a string. The standard
libraries of JavaScript, Python, Ruby and Go have no ANSI-aware wrap, so there are no
standard-library adapters. `word-wrap` was left out because it counts escape codes as
visible characters. See [shared methodology](../../README.md) for timing and reproduction.
