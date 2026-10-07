# ES2020 module parsing

One operation parses an ES module held in memory as a string and returns the
syntax tree the package produces. The 40 modules are built deterministically
from templates and are 1 to 8 kilobytes each, the size of ordinary source
modules (the sibling task `source-files` uses large classic scripts of ES2017
syntax). They use `import` and `export` declarations (named, default,
`export *`, `export * as`, `export { a as b }`), `import.meta`, dynamic
`import()`, optional chaining, nullish coalescing, BigInt literals, optional
catch binding, async generators with `for await`, spread and default
parameters. No JSX, types or proposals newer than ES2020.

A correct output is an ESTree-style tree for a module: a `Program` node with
`sourceType` `module`, either directly or as the `program` of a wrapper
(Babel's `File`, oxc's result object), and no reported errors. The verifier
checks, against values known from how each module was built:

- the number of top-level statements;
- the names declared at top level (functions, classes, `var`/`let`/`const`,
  also when exported);
- the number of import declarations and of export declarations;
- the number of `?.` links, `??` operators, BigInt literals, dynamic
  `import()` calls and `import.meta` uses anywhere in the tree.

Babel spells some nodes differently (`OptionalMemberExpression`,
`BigIntLiteral`, an `Import` callee); the verifier accepts each package's own
spelling. Location data, comments, tokens and other extras are not compared.
Trees are not copied, serialized or normalized inside the measured call; the
measured loop reads only the top-level statement count.

Packages run with their default settings, as installed. acorn, `@babel/parser`
and espree treat source as a classic script by default, so their default
adapters fail to read `import` and are recorded as not passing. acorn has no
default ECMAScript version (the option is required), so its adapter names
`ecmaVersion: 2020`; espree defaults to version 5, which its default adapter
keeps. A variant adapter for each, tagged as using non-default options, sets
`sourceType: 'module'` (and `ecmaVersion: 2020` for acorn and espree).
`esprima` is left out: it supports only up to ES2017 and cannot read optional
chaining, nullish coalescing or BigInt.

This is parsing only: no traversal, scope analysis, code generation or
tokenizer-only use. Inputs are preconstructed strings.
See [shared methodology](../../README.md) for timing and reproduction.
