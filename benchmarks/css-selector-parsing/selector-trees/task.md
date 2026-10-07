# CSS selector parsing

One operation parses a selector string (possibly a comma-separated list) with the
library's parser. Each of the 60 inputs is built from compound selectors (tag,
universal, class, id, attribute and pseudo-class/pseudo-element parts) joined by
descendant, child, adjacent and general-sibling combinators, in lists of one to
three selectors, some with functional pseudo-classes such as `:not(...)` and
`:nth-child(2n+1)`. Whitespace is mixed, with extra spaces around some
combinators. No comments, namespaces or nesting selectors.

Both libraries return their own tree (css-what: arrays of token objects;
postcss-selector-parser: a Root of Selector nodes) and the adapter returns it
as is; the measured call reads only the number of comma-separated selectors.
For the check, outside timing, the scenario maps the top-level tree to a common
shape: an array with one entry per comma-separated selector, each an array of
strings such as `tag:a`, `class:nav`, `id:main`, `attr:href`, `pseudo:hover`,
`universal` and `combinator`. Contents of functional pseudo-classes are not
inspected (they count as one `pseudo:` token). css-what represents classes and
ids as attribute tokens named `class`/`id`; the scenario maps them back to
`class:` and `id:`. Pseudo-elements are `pseudo:` with colons stripped.

The check compares against an independent oracle built with the fixtures, so a
library that returns the input, a constant or a wrong tree fails.

Packages run with default settings as installed. The parsers are created once
outside the measured call where the API has a reusable object (postcss-selector-parser's
`parser()` processor); parsing itself is timed. Serializing trees is outside
this task. There are no Rust or JSR packages with this job in the category's list.
