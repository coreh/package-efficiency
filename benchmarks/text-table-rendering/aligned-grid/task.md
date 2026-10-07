# Aligned text grid

One operation takes a table `{ headers, rows }` and returns a string: the table
laid out as aligned plain text. `headers` is a list of 8 strings; each row is a
list of 8 cells that mix strings (with spaces, accents and punctuation),
integers, decimals (all exactly representable, multiples of 1/8) and booleans. The 40 cases have between 3 and 60 rows.

A correct output has one line per table row, the header first, and on each
line that row's cells in order, every cell's text exactly as `String(cell)`
spells it (so `12.5` is not `125`), with nothing but padding and border
characters between cells. The columns must be aligned: within each column,
either every cell starts at the same display column (left-aligned) or every
cell ends at the same one (right-aligned), across the header and all rows. An
unpadded join of the cells therefore fails. Border style, padding width,
separators, the choice of left or right alignment per column, header
decoration and trailing whitespace are free, so packages that draw borders
and packages that only pad columns are both accepted; centred columns are
not, and no included package centres by default. Lines are not required to
have equal total width, because several packages trim trailing padding or
leave the last column unpadded.

Verification removes ANSI colour codes (some packages bold the header), takes
the lines that contain a letter or digit as the content lines (border and
separator lines have none) and locates each cell on its line. Display width
is counted in code points: every character in the fixtures, accented letters
included, and every border character the packages draw is a single code point
one terminal column wide. The fixtures contain no wide (CJK, emoji) or
combining characters, so width handling for those is not exercised.

Cells are converted to text inside the measured call, in every language, and
packages run with their default settings as installed. Libraries that need
column widths up front (`cliui`) are given the widest cell of each column,
computed in the call, so that nothing wraps. Text wrapping and terminal width
detection are not part of the task. Inputs are preconstructed; no output is
cached. The Go standard library entry uses `text/tabwriter`; Python and Ruby
have no standard-library table renderer, so they have no entry.

See [shared methodology](../../README.md) for timing and reproduction.
