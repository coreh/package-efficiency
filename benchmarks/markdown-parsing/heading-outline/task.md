# Heading outline

One operation parses one Markdown document (a string) with the library's parser and returns
the document's headings, in order, as a list of `[level, text]` pairs (level 1 to 6, text a
string). This is the parse-to-structure job (a block token list, a syntax tree or a stream of
parser events), not rendering to HTML, which is the sibling task `commonmark-to-html`.

The 36 cases are built deterministically from 4 to 40 sections each (about 0.5 to 6 kB). A
section has a heading (ATX, ATX with closing hashes, or setext with `===` or `---` underline), a
paragraph with emphasis, code and links, and some of: a bullet list, a fenced code block whose
lines start with `#`, an indented code block whose line starts with `#`, and a paragraph
beginning with `#hashtag` (no space, so not a heading). Heading text is plain words, so no
inline markup has to be flattened. All headings are at the top level of the document.

A correct output equals the independently built list of headings exactly. Returning no
headings, treating the `#` lines in code as headings, or missing setext or closed headings
fails. Each adapter does the small mapping from its library's structure to the common list
inside the measured call: marked reads `heading` tokens from `marked.lexer`, mdast-util-from-markdown
reads `heading` nodes of the tree, and pulldown-cmark collects the text events between a
heading's start and end events. The parser itself is the dominant cost.

Packages run with default settings as installed. Libraries that only return an HTML string
are a different job and are left out.
See [shared methodology](../../README.md) for timing and reproduction.
