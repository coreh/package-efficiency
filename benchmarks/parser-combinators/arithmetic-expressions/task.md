# Arithmetic expressions with parser libraries

One operation takes an arithmetic expression held in memory as a string,
parses it with a grammar that the adapter writes with the library under test
(combinators for nom, winnow and combine; a PEG grammar for pest), and returns
its value as an `f64`. The 44 expressions are made of non-negative decimal
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
Rust's `str::parse::<f64>`, so results must be identical to the JavaScript
`Number` arithmetic the verifier uses; no tolerance is applied. (`-0` and `0`
are treated as equal.) Division by zero does not occur in the fixtures.

The nom, winnow and combine adapters fold values while parsing; pest only
builds a parse tree, so its adapter folds over the pairs after parsing (that
fold is part of its measured work). Packages run with their default settings,
as installed. The grammar is built once (at compile time for pest, as plain
functions for the others), never per call.

See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- Rust: `nom`, `winnow`, `combine` (combinators) and `pest` (grammar with `pest_derive`).
- No npm or JSR package in this category is listed as a benchmark package, and
  no standard library ships a grammar toolkit.
