# CommonMark to HTML

One operation renders one Markdown document (a string) to an HTML string. The 36
cases are built deterministically from blocks: ATX headings, paragraphs with
emphasis, strong text, inline code and links, bullet and numbered lists, block
quotes, fenced code blocks (with a language) and thematic breaks, from 8 to 80
blocks per document (about 0.4 to 3.9 kB of Markdown), so that parsing rather than
per-call setup is most of a call. Code contains `&` and `<`, which must be escaped.

A correct output is the HTML that CommonMark specifies for these constructs.
Outputs are compared with an independently built expected string after only two
normalizations, applied in the verifier and not timed: whitespace between tags is
removed, and `<hr />` equals `<hr>`. Everything else (tags, attributes, text,
escaping) must match exactly. Inputs avoid quotes and apostrophes, whose escaping
differs between libraries.

Packages run with default settings as installed. Heading ids, syntax
highlighting, sanitizing and other options are off or absent by default and are
not used. Only libraries that return an HTML string for this input take part;
parsers that return a syntax tree are a different job and are left out.
See [shared methodology](../../README.md) for timing and reproduction.
