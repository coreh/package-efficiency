# CSS stylesheet parsing

One operation parses a whole stylesheet (a string of 1 to 9 KB) into the package's
syntax tree. The 36 fixtures are generated deterministically as component
stylesheets: class, id, attribute and pseudo selectors, selector lists and
combinators, `:root` custom properties, `!important`, `url()` and `calc()`
values, comments, `@import`, `@font-face`, `@media`, `@supports` and
`@keyframes` blocks, with Unicode in string values.

A correct output is a tree for the whole sheet. The verifier checks that the
number of top-level rules matches (comments are not rules, so a package that
keeps comments as nodes is not penalised), and that every class name, keyframes
name, custom property name and string literal written in the source can be found
in the tree. Tree shapes differ between packages (node classes, linked lists,
plain objects, selectors as text or as nodes) and all are accepted; the verifier
only reads them, outside measured work. The measured loop consumes only the
size of the top-level rule list.

Packages run with their default settings as installed: no source positions are
requested where they are optional, so each tree is what the plain `parse` call
gives. Value-level detail varies (css-tree parses declaration values into
nodes, `@adobe/css-tools` keeps them as text); that is each package's normal
output and is part of what is measured.

Left out: `lightningcss` has no JavaScript call that returns a tree (its Node
API transforms and prints), `@csstools/css-parser-algorithms` works on
tokens from a separate tokenizer and does not parse a stylesheet, and the Rust
`cssparser` crate is a tokenizer whose stylesheet parser must be supplied by
the caller.

See [shared methodology](../../README.md) for timing and reproduction.
