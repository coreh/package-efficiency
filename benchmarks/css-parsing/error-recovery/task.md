# Parsing stylesheets with errors

One operation parses a whole stylesheet (a string of 1 to 8 KB) that contains
mistakes, into the package's syntax tree. The existing `stylesheets` task feeds
clean CSS; this one measures the error-recovery path. The 32 fixtures are
generated deterministically and mix valid rules with the mistakes found in
hand-edited sheets: declarations without a colon, empty values, `*zoom` and
`_height` hacks, `progid:` filters, an IE `expression()` value, `!imp`, doubled
semicolons, empty rules, unknown vendor at-rules with a block, and rules inside
`@media` that contain a broken declaration. Mistakes are placed only where the
packages recover the same way (the broken declaration is dropped or kept as a
raw node and parsing goes on). Constructs the packages treat differently, such
as stray closing braces, unclosed blocks or `<!--` markers, are not in the
fixtures.

A correct output is a tree for the whole sheet. The verifier checks that:

- the number of top-level rules and at-rules matches (comments are not rules);
- no string in the tree contains a brace, so a result that only wraps the source
  text fails;
- every class name, string literal and unique number of the valid declarations
  (`order: 10042`, `z-index: 10043`) can be found in the tree, so a parser that
  gives up at the first mistake fails.

Tree shapes differ between packages and all are accepted. The verifier only
reads them, outside measured work. The measured loop consumes only the size of
the top-level rule list.

Packages run with their default settings as installed, except where a variant
says otherwise. `@adobe/css-tools` throws on the first mistake by default; it
only recovers with its `silent: true` option, so the default entry fails the
checks and the variant `css-tools-silent` (`BENCH_CSS_TOOLS=silent`) passes
them. `css-tree` recovers by default, keeping unparsable declarations as `Raw`
nodes.

The two packages do different amounts of work per rule: `css-tree` parses
selectors and declaration values into nodes, `@adobe/css-tools` keeps them as
text. That is each package's normal output and is part of what is measured.
Only two entries pass the checks here, one of them through its variant, so
this is a comparison of those two.

Left out, as in `stylesheets`: `lightningcss` (no JavaScript call that returns a
tree), `@csstools/css-parser-algorithms` (works on tokens, not stylesheets) and
the Rust `cssparser` crate (a tokenizer without a stylesheet parser).

See [shared methodology](../../README.md) for timing and reproduction.
