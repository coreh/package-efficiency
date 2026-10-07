# JavaScript source parsing

One operation parses a plain JavaScript program held in memory as a string and
returns the syntax tree the package produces. The 40 programs are built
deterministically from templates (functions with default and rest parameters,
classes with getters and static methods, async functions with try/catch/finally,
generators, switch statements, regular expressions, template literals,
destructuring, arrow functions, IIFEs, loops) and range from about 7 to 35
kilobytes. They use only syntax up to ES2017, written as a classic script (no
modules, JSX or types), so every package, including the oldest, accepts them.
Packages run with their default settings, as installed; where a parser cannot
be called without naming a language version (espree) or its documentation shows
the option, the adapter passes `ecmaVersion: 2020`.

A correct output is an ESTree-style tree: a `Program` node, either directly or
as the `program` of a wrapper (Babel's `File`, oxc's result object), and no
reported errors. The verifier checks, against values known from how each
program was built:

- the number of top-level statements;
- the names declared at top level by functions, classes and `var`/`let`/`const`;
- the total number of `CallExpression` nodes anywhere in the tree;
- the total number of `FunctionDeclaration` nodes anywhere in the tree.

Location data, comments, tokens, parenthesized-expression nodes, literal node
names and other extras are not compared, so differences in how much extra
information a package attaches are accepted as the package's own default
output. Trees are not copied, serialized or normalized inside the measured
call; the measured loop reads only the top-level statement count.

This is parsing only: no traversal, scope analysis, code generation or
tokenizer-only use. Inputs are preconstructed strings.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- npm: `acorn` `parse`, `@babel/parser` `parse`, `espree` `parse`, `esprima` `parseScript`, `oxc-parser` `parseSync`.
