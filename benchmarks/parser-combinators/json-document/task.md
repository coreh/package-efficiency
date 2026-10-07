# JSON grammar with parser libraries

One operation parses a JSON document held in memory as a string, using a JSON
grammar that the adapter writes with the library under test (combinators for
nom, winnow and combine; a PEG grammar for pest), and returns a generic value
tree. The 40 documents are valid JSON text of varying size (a hundred bytes to
a few kilobytes), pretty-printed or compact: records, nested objects and
arrays, numbers (integers, negatives, decimals, exponents), strings with
escapes (`\n`, `\"`, `\\`, `é`, surrogate pairs), Unicode text, `true`,
`false` and `null`. Packages run with their default settings, as installed.

A correct output is a value equal to `JSON.parse` of the text: same keys, same
object contents (key order is not compared), same strings, booleans, `null`,
arrays and numbers.

Every adapter returns `serde_json::Value`, so the work of building the tree is
the same. The grammar and its string unescaping and number conversion are
written in every adapter in the same way: the grammar recognises a string
body, then one shared-shape helper decodes the escapes; a number is read as
`i64` when it has no fraction or exponent, otherwise as `f64`. Objects use
`serde_json::Map`. The harness converts the result to JSON for the verifier
once per fixture, before any measured work; the measured call is the parse, a
read of the top-level length, and dropping the tree.

This task measures the libraries as parser toolkits, not as JSON parsers: no
hand-written parser or fixed-format JSON library (such as `serde_json` itself)
is included. Inputs are preconstructed strings; the whole input must be
consumed.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- Rust: `nom`, `winnow`, `combine` (combinators) and `pest` (grammar with `pest_derive`).
- No npm or JSR package in this category is listed as a benchmark package, and
  no standard library ships a grammar toolkit, so there are no JavaScript,
  Python, Ruby or Go adapters.
