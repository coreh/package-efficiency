# Evaluate JSONPath queries

One operation takes a parsed JSON document and a JSONPath query as text,
evaluates the query and returns the list of selected values. A query that
selects nothing gives an empty list.

## Inputs

45 fixtures: 3 documents (a catalog with 12, 24 and 40 books, one bicycle, a
key that needs bracket notation, and 4, 8 and 12 orders with 2 to 5 line items
each) times 15 queries. The queries use only features that RFC 9535 defines and
that the packages share:

- child names with dots and brackets (`$.store.bicycle.color`,
  `$['odd key']['a.b']`), wildcards (`$.store.book[*].author`);
- array indexes and slices, including a negative start (`$.store.book[-3:].title`,
  `$.orders[*].items[0:2].qty`);
- filters on one comparison (`<`, `>=`, `==`) written with parentheses, and an
  existence test (`$.store.book[?(@.isbn)].isbn`);
- descendant search (`$..price`, `$..sku`);
- a query that selects nothing (`$.store.missing[*]`).

Not used, because packages differ: a negative index on its own (`[-1]`, which
`jsonpath` and `jsonpath-plus` do not read), unions, `&&` and `||`, functions
such as `length()` and `match()`, and comparisons against missing members.

## Correct output

A list of the selected values, equal to the reference's. The reference in
`scenario.mjs` computes each answer directly from the document, not from a
package. Order matters: results are compared in order, and a single value
instead of a one-item list fails. The exception is `$..price`: RFC 9535 does not
say whether a descendant search goes depth first or level by level, and
`jsonpath-rfc9535` walks level by level where the others go depth first, so that query is
compared as a multiset. `$..sku`, whose matches all sit at one depth, is
compared in order.

## What is measured

Each call parses the query text and evaluates it against the document, with the
package's default options as its documentation shows. The document is already
parsed (reading JSON is not the task). Where a package compiles the query first
and then runs it (`jsonpath-ng`, `serde_json_path`, `theory/jsonpath`), both
steps are in the call, as every package is given the query as text. A package
that returns references into the document returns them; the Rust adapters
keep the count and run the query again for the verifier. Where a package reports
"nothing selected" as an error or a null (AsaiYusuke/jsonpath, ojg), the adapter
maps it to an empty list inside the call.

## Packages

- npm: `jsonpath-plus`, `jsonpath`, `json-p3`, `jsonpath-rfc9535`.
- Rust: `jsonpath-rust`, `serde_json_path`, `jsonpath_lib`.
- PyPI: `jsonpath-ng` (the `ext` parser, which has filters), `jsonpath-python`, `python-jsonpath`.
- RubyGems: `jsonpath`.
- Go: `ohler55/ojg`, `theory/jsonpath`, `AsaiYusuke/jsonpath`.

Left out: `nimma` (npm) is a callback-based engine for linting, not a query
function; its author's `jsonpath-rfc9535` is included. `PaesslerAG/jsonpath` and
`yalp/jsonpath` (Go) return a single value for a definite path and a list for a
wildcard, so a one-item list cannot be told from a list value without bending
the task. JMESPath, JSON Pointer and `glom` are other query languages. The
standard libraries of JavaScript, Python, Ruby and Go evaluate no JSONPath, so
there are no built-in adapters. No JSR package was found.
See [shared methodology](../../README.md) for timing and reproduction.
