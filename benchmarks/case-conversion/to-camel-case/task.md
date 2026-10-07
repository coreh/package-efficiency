# Identifier to camelCase

One operation converts one identifier string to lowerCamelCase: the first word
in lower case and every later word with a capital first letter, no separators.
The 60 cases are two to six lowercase ASCII words written as snake_case,
kebab-case, space separated words, PascalCase, camelCase, or words joined by a
mix of `_` and `-`. A correct output is exactly the words in camelCase, for
example `first_name` and `FirstName` both give `firstName`.

Inputs are built from plain lowercase words, with no digits, acronyms, runs of
separators or non-ASCII letters, because packages disagree on those (digit
boundaries, `XMLHttp`, Unicode). No spelling differences are accepted: the
output must equal the expected string exactly. Packages run with their default
settings as installed; each is called through its plain camelCase function.
Libraries that only convert in the other direction (decamelize) or that
produce PascalCase from words only (toidentifier) do not do this job and are
left out. The standard libraries of JavaScript, Python, Ruby and Go have no
such function, so there are no built-in adapters.

See [shared methodology](../../README.md) for timing and reproduction.
