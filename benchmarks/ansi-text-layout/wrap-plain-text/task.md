# Greedy word wrap of plain text

One operation takes a paragraph of plain words on a single line and a width, and
returns the paragraph word-wrapped to that width with greedy first-fit breaking:
each word goes on the current line if the line, one space and the word fit in the
width, and starts a new line otherwise. The input is `{ text, width }`.

The 30 cases are paragraphs at widths 40, 72 and 100, ten at each. The first of
each width is shorter than the width (one line); the others run from about 230
to 2,300 columns, 3 to 56 lines. Words are 1 to 14 letters, ASCII and accented
Latin letters (all precomposed, one column each: `café`, `jalapeño`, `Ångström`),
separated by single spaces. There are no escape codes, tabs, line breaks,
hyphens, slashes or punctuation, where wrappers break by different rules
(Unicode line-break classes, splitting at hyphens), and no word is wider than
the narrowest width, so no package has to break a word. 96 lines of the answers
fill their width exactly, so a wrapper that is one column short or long fails.
The ANSI-aware sibling task `wrap-to-80-columns` accepts any break placement
within a line of greedy; this one asks for the greedy lines exactly.

## What counts as correct

The scenario computes the greedy wrap itself (widths in code points, which are
columns for these words) and compares the lines exactly, in order. Accepted as
style:

- a list of lines, or one string with `\n` between lines, as each library
  returns it (the string-returning ones join the lines inside the timed call;
  that is their API);
- one final `\n` at the end of a string;
- spaces at the end of a line, which are removed before comparing.

Everything else is substance: a leading space, a blank line, a word lost or
moved, a line one column too wide or a break one word early. When the scenario
loads it proves the check refuses the input unchanged, a wrap to one column
less and to one column more, a wrap that counts UTF-8 bytes, minimum-raggedness
breaks (valid lines, but not greedy ones), lines with a leading space, a blank
line between lines, a word dropped, another fixture's lines and a constant.

Every package runs in its one-shot form, with the options named below and no
state kept between calls. Indentation, justification, hyphenation and breaking
of long words are outside this task.

## Packages

| Entry | What the adapter calls |
| --- | --- |
| `builtin/python-textwrap` | `textwrap.wrap(text, width)`, default options, a list of lines |
| `npm/word-wrap` | `wrap(text, { width, indent: "", trim: true })`, a string (the default indent is two spaces and trailing spaces are kept) |
| `npm/wrap-ansi` | `wrapAnsi(text, width, { hard: false, trim: true })`, a string |
| `cargo/textwrap` | `textwrap::wrap(text, Options::new(width).wrap_algorithm(WrapAlgorithm::FirstFit))`, a `Vec<Cow<str>>` (the default algorithm is optimal fit, which gives other lines) |
| `rubygems/word_wrap` | `WordWrap.ww(text, width, true)`, a string with a final `\n` |
| `gomod/github.com/mitchellh/go-wordwrap` | `wordwrap.WrapString(text, uint(width))`, a string |

The package entries are written separately; this list says what each is to
call. `word_wrap` is called in its `fit` mode (third argument `true`): its
default `wrap` mode only breaks lines longer than the width, and then at the
last space before column `width`, so its lines are at most `width - 1` columns
except the last, one column short of greedy.

## Left out

- `gomod/github.com/kr/text`: its `Wrap` minimizes raggedness instead of
  filling lines greedily, so it gives different, equally valid lines. A
  property check (every line within the width, the words in order) could admit
  it and `textwrap`'s optimal fit; that would be another task.
- JavaScript (Node, Bun, Deno), Ruby and Go have no word wrap in their standard
  libraries, so `textwrap` is the only standard-library entry.
