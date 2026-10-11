# Arithmetic expressions with parser libraries

One operation takes an arithmetic expression held in memory as a string,
parses it with a grammar that the adapter writes with the library under test
(combinators, a PEG grammar or an LALR grammar, whatever the library takes),
and returns its value as a double-precision float. The 44 expressions are made of non-negative decimal
numbers (`7`, `3.25`), the binary operators `+ - * /`, unary minus (including
`--3` and `2*-3`), and parentheses nested up to four levels, with spaces and
tabs between tokens in most of them. Fourteen are short hand-written cases
(precedence, left associativity, nesting, whitespace); thirty are generated
deterministically and range from about a hundred bytes to about ten kilobytes.

This differs from the JSON task: the grammar is recursive through several
precedence levels with left-associative operator chains, the result is one
number rather than a tree, and the input is mostly short tokens, so the cost is
dominated by the libraries' per-token combinator and backtracking overhead.

A correct output is exactly the number a left-to-right evaluation gives:
`*` and `/` bind tighter than `+` and `-`, each chain folds from the left in
`f64`, unary minus applies to the factor after it, and the whole input
(allowing surrounding whitespace) must be consumed. Numbers are converted with
the language's own string-to-float conversion (Rust `str::parse::<f64>`, Python
`float`, Ruby `to_f`), so results must be identical to the JavaScript `Number`
arithmetic the verifier uses; no tolerance is applied. (`-0` and `0`
are treated as equal.) Division by zero does not occur in the fixtures.

Some adapters fold values while parsing (nom, winnow, combine, the parse
actions of pyparsing, ply and racc); others build a parse tree and evaluate it
afterwards (pest, lark, parslet, treetop), and that evaluation is part of their
measured work. Packages run with their default settings, as installed. The
grammar or parser is built once, when the adapter loads (at compile time for
pest), never per call.

See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- Rust: `nom`, `winnow`, `combine` (combinators) and `pest` (grammar with `pest_derive`).
- Python: `pyparsing`, `lark` (Earley, the default) and `ply` (LALR).
- Ruby: `parslet`, `citrus`, `treetop`, `raabro` and `racc` (LALR).
- No npm or JSR package in this category is listed as a benchmark package, and
  no standard library ships a grammar toolkit.
