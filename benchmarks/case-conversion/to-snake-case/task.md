# camelCase and PascalCase to snake_case

One operation converts one identifier string to lower snake_case: every word in
lower case, joined by single `_`. This is the reverse direction of the
to-camel-case task, and it is the split-at-capitals job (finding word
boundaries inside a joined identifier) rather than the join job.
The 60 cases are two to six lowercase ASCII words written as camelCase or
PascalCase (alternating by case), for example `firstName` and `FirstName` both
give `first_name`. A correct output is exactly the words in lower case joined
by `_`.

Inputs are plain words with no digits, acronyms, separators or non-ASCII
letters, because packages disagree on those. No spelling differences are
accepted: the output must equal the expected string exactly. The verifier also
rejects an output that is the input unchanged (every fixture contains capitals).
Packages run with their default settings as installed; each is called through
its plain snake-case function (decamelize with its default `_` separator).
`camelcase` and `toidentifier` do not produce snake_case and are left out. The
standard libraries of JavaScript, Python, Ruby and Go have no such function, so
there are no built-in adapters.

See [shared methodology](../../README.md) for timing and reproduction.
