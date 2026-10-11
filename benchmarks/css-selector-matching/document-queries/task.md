# Selector queries on a parsed document

One operation compiles a CSS selector string and returns every element of an
already parsed HTML document that it matches, in document order. The 44
fixtures use one generated document of about 50 KB (30 cards with headings,
links, lists, tables and forms in six sections) and 44 selectors: type, class,
id, attribute operators (`^=`, `$=`, `*=`, `~=`, `|=`, case-insensitive `i`),
child, descendant and sibling combinators, structural pseudo-classes
(`:nth-child`, `:nth-of-type`, `:first-child`, `:last-of-type`, `:empty`),
`:not()`, `:is()`, selector lists, the universal selector, and a selector that
matches nothing.

Parsing the document is not timed: the adapter's `prepare` parses it once with
the library's HTML parser. Compiling the selector is timed, with no cache of
compiled selectors between calls. Each element in the document has a unique
`data-n` attribute (its position in document order). A correct result is the
list of matching elements; the check reads `data-n` from each one and compares
the list with an independent reference computed from the tree that generated
the document. Reading the attribute happens only in the check, not in the
measured work.

The document is well-formed on purpose (explicit `tbody`, no implied tags), so
that the HTML5 parsers and the forgiving parsers the libraries use all build the
same tree. Packages run with their default settings as installed.

## Entries

- npm `css-select`, over a `htmlparser2` tree: `selectAll(selector, document)`.
- Rust `scraper` (the `selectors` engine from Servo with html5ever's tree):
  `Selector::parse(selector)` and `Html::select`, collecting the matched node ids.
  `selectors` itself has no tree and needs a hand-written tree adapter, so the
  crate that wraps it is used.
- Python `cssselect2`: `ElementWrapper.query_all(selector)` over an html5lib
  ElementTree.
- Python `soupsieve`: `soupsieve.select(selector, soup)` over a BeautifulSoup
  tree built with `html.parser`.
- Python `cssselect`, through lxml's `CSSSelector(selector)(root)` over an
  `lxml.html` tree. It rejects the `i` flag of `[data-kind="NOTE" i]`, so it
  does not pass here.
- Go `andybalholm/cascadia`: `cascadia.Compile(selector)` then `MatchAll` over
  an `x/net/html` tree. It rejects `:is()`, so it does not pass here.
- Go `PuerkitoBio/goquery`: `Document.Find(selector).Nodes`. It compiles with
  cascadia and matches nothing for `:is(h2, h3) + p`, so it does not pass here.

## The lenient task

This is the strict task of a pair.
[document-queries-lenient](../document-queries-lenient/task.md) runs the same
adapters on the same document with only the 42 selectors written in Selectors
Level 3, without `:is(h2, h3) + p` and `[data-kind="NOTE" i]`. cascadia and
goquery, which refuse the first, and cssselect, which refuses the second, pass
there.
See "Strict and lenient tasks" in the [shared methodology](../../README.md).
