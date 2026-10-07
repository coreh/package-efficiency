# Wide and combining characters

One operation takes a table `{ headers, rows }` and returns a string: the table
laid out as aligned plain text. `headers` is a list of 7 strings; each row has 7
cells. Text cells mix Japanese, Chinese and Korean text, fullwidth Latin letters
and Latin text whose accents are combining marks (decomposed, NFD), alongside
plain ASCII; the other cells are integers and decimals (multiples of 1/8). The 36
cases have between 3 and 60 rows. Unlike the aligned-grid task, the point is
that columns line up by display width, not by character count: wide characters
take two terminal columns and combining marks take none.

Cell text is compared after Unicode NFC normalization of both sides (some packages compose accents), so canonically equivalent spellings are accepted.

A correct output has one line per table row, the header first, with each cell's
text exactly as `String(cell)` spells it and nothing but padding and border
characters between cells. Within each column, either every cell starts at the
same display column or every cell ends at the same one, across the header and
all rows. Display width is counted as: combining marks 0, CJK ideographs, kana,
Hangul syllables and fullwidth forms 2, everything else 1 (border characters are
1). A package that pads by code point or UTF-16 length fails. Border style,
padding, the choice of left or right alignment per column, header decoration
and trailing whitespace are free; ANSI colour codes are stripped before checking.
Fixtures contain no emoji or ambiguous-width characters.

Cells are converted to text inside the measured call and packages run with their
default settings as installed. `cliui` needs column widths up front: it is given
twice the longest cell's length plus one for each column (an upper bound on
display width, so nothing wraps) and measures and pads by display width itself.
So for the two `cliui` entries the column sizing is a few lines of adapter code
over UTF-16 lengths, while `comfy-table` and `@cliffy/table` size the columns
themselves from the display width of every cell: `cliui` is a column layout
tool, not an auto-sizing table renderer, and is given slightly less to do.
`comfy-table`'s default preset draws a full box with a separator line between
every row, about twice the lines of the others.
Text wrapping and terminal width detection are not part of the task. Inputs are
preconstructed; no output is cached. Go `text/tabwriter` counts code points and
has no width handling, so it has no entry; Python and Ruby have no standard
table renderer.

See [shared methodology](../../README.md) for timing and reproduction.
