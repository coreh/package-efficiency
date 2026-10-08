# HTML document to Markdown

One operation is given an HTML fragment (a string of 0.5 to 50 kB, one
`<article>` element) and returns it as Markdown text. The 12 fragments are
built deterministically from a seeded generator and hold headings (levels 1 to
6), paragraphs, bullet and numbered lists nested up to three levels, links
(some with a `title`), strong, emphasis (`<em>` and `<i>`), inline code and
`<pre><code>` blocks. Text includes accented and Japanese words, `&`, quotes
and, in code, `<`, `>`, `&` and lines that look like Markdown (`- item`,
`## heading`). The source is pretty-printed in places: paragraphs and list
items contain line breaks and indentation between words, and lists are indented.

The operation is the library's plain "convert this string" call with default
options. The result is the library's string. Reading the input is nothing to
do with the library, so nothing is prepared.

## What counts as correct

Converters make different style choices, and none of them is compared: ATX or
setext headings, the bullet character (`-`, `*`, `+`), the indentation of nested
lists (2, 3 or 4 spaces), `*` or `_` for emphasis, fenced or indented code
blocks, a language name on a fence, line wrapping, blank lines between blocks,
a link title, backslash escapes, a trailing newline.

The generator records what a correct conversion must contain. The verifier
reads each output with a small Markdown reader (in `scenario.mjs`) into:

- the blocks in order: heading (level and text), paragraph (text), list item
  (depth, bullet or numbered, text) and code block (its exact lines);
- the links as (text, target), and the strong, emphasized and code-span texts,
  each in document order.

Text is compared with white space collapsed (a line break is a space) and
escapes removed. So a heading at the wrong level, a lost or flattened list
level, a bullet turned numbered, a lost link target, emphasis dropped or added,
code text changed or turned into a paragraph, a dropped or joined word, an
unescaped entity (`&amp;` left in the text) or markup left in the output fails.
The input returned unchanged and the input with its tags stripped are rejected
when the scenario loads.

Left out of the fixtures:

- Tables. The conversion is an extension (GFM) for some libraries and a default
  for others, and the output styles (pipe table, plain cell text, HTML left in
  place) are not comparable without a table reader. A separate task would do.
- A `<pre>` without `<code>`. `turndown` and `node-html-markdown` treat it as a
  paragraph by their documentation; `<pre><code>` is what Markdown renderers
  produce and what every library reads.
- Images, blockquotes, horizontal rules, `<br>`, a full document with `<head>`.
- A code block directly after a list (indented code and a list continuation
  cannot be told apart), and Markdown special characters in plain text, whose
  escaping differs by library.

## Packages

Each adapter calls the one function its documentation shows with default
options. No standard library of the four languages converts HTML to Markdown,
so there are no builtin adapters.

- npm `turndown` (`new TurndownService()` once, `turndown(html)`), `node-html-markdown`
  (`NodeHtmlMarkdown.translate`), `html-to-md` (`html2md`).
- Crates `htmd` (`convert`), `html2md` (`parse_html`), `html-to-markdown-rs` (`convert`).
- PyPI `markdownify`, `html2text`, `html-to-markdown` (`convert(...).content`).
- RubyGems `reverse_markdown`; Go `JohannesKaufmann/html-to-markdown` (`ConvertString`).

Libraries do different amounts of work: `html-to-markdown` (PyPI) also collects
page metadata and tables in the same call, and `node-html-markdown` and
`turndown` build a DOM first. Each is measured as it is called.

Not passing, with defaults, on the fixtures: `html-to-md` (whitespace between
adjacent inline elements is lost), `html-to-markdown-rs` (nested lists are folded
into the item text), `html2text` (an `&` inside emphasis gets a space before it)
and `reverse_markdown` (the space between a closing strong or emphasis and a
double quote is dropped). They are real differences in the text, not style, and
no option fixing them was found, so there are no variants.

Left out: `showdown` (needs a DOM implementation in Node), `rehype-remark` and
`unified` pipelines (many packages, no single call), `pandoc` wrappers (an
external program), `kramdown` (Ruby; converts HTML to Kramdown syntax, a
different dialect), and `markitdown` (a document converter that calls other
packages).

## The lenient task

This is the strict task of a pair. [documents-lenient](../documents-lenient/task.md) runs the same
adapters on the same inputs with a check that leaves out or forgives one
stated kind of difference. It has the same 12 fragments and does not compare white space inside an inline element or beside one. `html2text` and `reverse_markdown` pass there; `html-to-md` (it also decodes entities in a code block twice) and `html-to-markdown-rs` do not.
See "Strict and lenient tasks" in the [shared methodology](../../README.md).
