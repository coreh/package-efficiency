# HTML document to Markdown, lenient

The lenient form of [documents](../documents/task.md), which is the strict
task. One operation is the same: it is given an HTML fragment (a string of 0.5
to 50 kB, one `<article>` element) and returns it as Markdown text. The 12
fragments are the strict task's own, byte for byte, in the same order: nothing
is removed, so both tasks time the same inputs. The entries are the adapters
of the strict task, unchanged; this folder has none of its own
(`"adaptersFrom"` in `task.json`).

The strict task says which converters keep the text exactly. This one compares
the cost of converting among all the converters that keep the structure and
the words, including those that the strict task turns away for one space.

## What differs from the strict task

Only the check. The output is read with the strict task's Markdown reader, and
everything about structure is compared as there. One kind of difference is
forgiven: **white space inside an inline element or beside one.**

- Inside the text of strong, emphasis or a link: a space may be added or
  missing anywhere (`_R &D_` for `<em>R&amp;D</em>`).
- Between an inline element (strong, emphasis, link or code span) and what is
  next to it, text or another element: one space or none
  (`` `x`[y](/z) `` for `<code>x</code> <a href="/z">y</a>`, `**a b**"q"` for
  `<strong>a b</strong> "q"`).

The reason it is one class and not a list of bugs: where an inline element
begins and ends is where every converter has to decide what to do with the
white space of the HTML, which collapses there by rules of its own, and
Markdown has rules of its own about delimiters next to spaces and punctuation.
The words, their order, and which of them are emphasized, linked or code are
unchanged by it.

## What is still compared, exactly as in the strict task

- The blocks in order: heading and its level, paragraph, list item with its
  depth and whether it is numbered, code block with its exact lines.
- Plain text: every word, with one space between two words of a run of plain
  text. Two plain words joined, or a word dropped, fail.
- The text of a code span, character for character.
- Which texts are strong, emphasized, code and links, in document order, and
  every link target.
- Entities: `&amp;` left in the text fails, and so does a code block whose
  `&amp;` was decoded twice.

The scenario reads each HTML fragment itself (the generated HTML has one
regular shape) to know where the inline elements are, and checks that reading
when it loads: each fragment, written back as plain Markdown from what was
read, must pass the strict task's check, which compares it with the
generator's own record. It then proves the check on outputs it writes itself:
no space on either side of any inline element and a space put inside every
emphasis pass here and fail the strict check; the input unchanged, the input
with its tags stripped, two plain words joined, a dropped word (in plain text
and in a link), a flattened list, a link without its target, emphasis written
as plain text and a changed code span all fail here.

## Entries that pass only here

Each has its reason in its adapter's notes, in the strict task's folder:

- `html2text` (PyPI): an `&` inside emphasis gets a space before it.
- `reverse_markdown` (RubyGems): the space between a closing strong or
  emphasis and a following double quote is dropped.

Still not passing, because the difference is not of this kind:

- `html-to-md` (npm): besides losing the space between adjacent inline
  elements, which is forgiven here, it decodes entities in a code block twice
  (`&amp;amp;`, the text `&amp;`, comes out as `&`).
- `html-to-markdown-rs` (Rust): a nested list is folded into the text of its
  item.

See [shared methodology](../../README.md) for timing and reproduction, and
"Strict and lenient tasks" there for the rules of such a pair.
