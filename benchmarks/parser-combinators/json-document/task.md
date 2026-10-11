# JSON grammar with parser libraries

One operation parses a JSON document held in memory as a string, using a JSON
grammar that the adapter writes with the library under test (combinators, a
PEG grammar or an LALR grammar, whatever the library takes), and returns a
generic value tree. The 40 documents are valid JSON text of varying size (a hundred bytes to
a few kilobytes), pretty-printed or compact: records, nested objects and
arrays, numbers (integers, negatives, decimals, exponents), strings with
escapes (`\n`, `\"`, `\\`, `é`, surrogate pairs), Unicode text, `true`,
`false` and `null`. Packages run with their default settings, as installed.

A correct output is a value equal to `JSON.parse` of the text: same keys, same
object contents (key order is not compared), same strings, booleans, `null`,
arrays and numbers.

The grammar, its string unescaping and its number conversion are written the
same way in every adapter of a language: the grammar recognises a string body,
then one helper decodes the escapes; a number is read as an integer when it has
no fraction or exponent, otherwise as a float. The Rust adapters all return
`serde_json::Value` (objects as `serde_json::Map`), so the work of building the
tree is the same; the harness converts it to JSON for the verifier once per
fixture, outside measured work, and the measured call is the parse, a read of
the top-level length, and dropping the tree. The Python adapters build dicts and
lists, the Ruby adapters hashes and arrays.

This task measures the libraries as parser toolkits, not as JSON parsers: no
hand-written parser or fixed-format JSON library (such as `serde_json` itself)
is included. Inputs are preconstructed strings; the whole input must be
consumed.

See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- Rust: `nom`, `winnow`, `combine` (combinators) and `pest` (grammar with `pest_derive`).
- Python: `pyparsing`, `lark` (Earley, the default) and `ply` (LALR).
- Ruby: `parslet`, `citrus`, `treetop`, `raabro` and `racc` (LALR).
- No npm or JSR package in this category is listed as a benchmark package, and
  no standard library ships a grammar toolkit, so there are no JavaScript or Go
  adapters.
