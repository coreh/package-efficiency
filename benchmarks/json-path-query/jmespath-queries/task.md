# Evaluate JMESPath expressions

One operation takes a parsed JSON document and 40 JMESPath expressions,
already compiled, evaluates each expression against the document and returns
the list of 40 results in the same order. An expression that selects nothing
gives `null` (None, nil, Go's `nil`) in its place.

## Inputs

3 fixtures: 3 documents, each evaluated with the same 40 expressions. A
document is a bookstore with 8, 20 and 40 books (title, author, category,
price, year, a list of tags, an `isbn` on every third book, a nested `stock`
object), 6, 12 and 20 people (name, age, an address that one person in seven
lacks, a list of friends), 4, 9 and 16 orders with 1 to 4 line items, a ragged
matrix for flattening and an object with keys that need quoting (`"a.b"`).
Strings include non-ASCII letters (`Écume`, `Zürich`, `Gaël`). Prices, years
and titles are distinct within a document, so `sort_by`, `max_by` and
`min_by` never meet a tie.

The expressions cover what JMESPath has that JSONPath does not:

- field access, negative indexes and slices with a step (`store.books[-1]`,
  `store.books[::3].year`, `store.books[::-1].title`);
- list and filter projections, with `==`, `<`, `>`, `>=`, `&&`, `||`, `!`
  and a function in the filter (`store.books[?contains(tags, 'b')].title`);
- a projection that leaves out nulls (`store.books[*].isbn`) beside `map`,
  which keeps them (`map(&isbn, store.books)`);
- a projection on a projection, which gives nested lists, with empty lists
  kept (`orders[*].items[?qty > \`3\`].sku`), and `[]`, which flattens one
  level (`orders[].items[].sku`, `matrix[]`);
- multiselect lists and hashes, inside a projection and at the top, with a
  null member kept (`people[*].{name: name, city: address.city}`);
- pipes (`people[?age > \`40\`].name | sort(@)`);
- functions: `length`, `sort_by`, `sort`, `reverse`, `max_by`, `min_by`,
  `max`, `sum`, `avg`, `join`, `contains`, `starts_with`, `type`,
  `to_string`, `not_null`, `keys` (sorted, since key order is not specified).

The expected values come from a direct JavaScript computation written next
to each expression in `scenario.mjs`, following the JMESPath specification
(the semantics its compliance suite tests), not from a package.

Not used, because the specification leaves it open or packages differ:
`values` and object wildcards (`*.name`), whose order follows a map's order
(random in Go); `<` and `>` between strings or mixed types; ties in `sort_by`
(go-jmespath's sort is not stable); `length` of strings outside the Basic
Multilingual Plane; and equality between `true` and `1`.

## Correct output

A list of 40 values, each deeply equal to the reference's value for that
expression as JSON, in order. A multiselect hash is compared as an object
(key order is not compared). Numbers are compared by value: Go returns every
number as a float, Python and Ruby keep whole numbers as integers, and the
JSON the verifier reads is the same. Nothing else is accepted: no shorter
list, no `[]` for `null`, no flattened list where JMESPath nests. The
scenario proves at load that the check refuses a list of nulls, a reversed
list, another fixture's list, a projection that keeps nulls, a `map` that
drops them, nested projections flattened, an unflattened matrix, a
multiselect hash that drops a null member, a `sort_by` that keeps input
order, a wrong average and a number given as a string.

## What is measured

Each call evaluates the 40 compiled expressions against the document, with
the package's default options. Compiling the expressions happens once per
fixture in `prepare`, outside the timed call, for every package: Python's
`jmespath.search` keeps parsed expressions in a cache of its own between
calls, while Ruby's `JMESPath.search` and Go's `jmespath.Search` parse on
every call, so timing the parse would compare caches rather than evaluators.
The document is already parsed (reading JSON is not the task). Values are
returned as the package returns them.

go-jmespath's `sort_by` sorts the array it is given in place, so
`sort_by(store.books, &price)` reorders the document's own `books` list. The
fixtures keep the expression (it is the ordinary way to write it, and a
query must not change the document it reads); with go-jmespath the later
expressions that read `store.books[0]` then see another book, and the check
fails on fixture 1. Ruby's and Python's `sort_by` sort a copy.

## Packages

- PyPI: `jmespath` (`jmespath.compile(expression)` in `prepare`, then
  `.search(document)`).
- RubyGems: `jmespath` (`JMESPath::Parser.new.parse(expression).optimize` in
  `prepare`, then `.visit(document)`; this is what `JMESPath.search` does
  inside).
- Go: `jmespath/go-jmespath` (`jmespath.Compile(expression)` in `prepare`,
  then `.Search(document)`); does not pass, see above.

Left out: the standard libraries of JavaScript, Python, Ruby and Go evaluate
no JMESPath, so there are no built-in adapters. npm `jmespath` and
`@jmespath-community/jmespath` are not in the categorized package set; both
take an expression and a document and could join as they are. JSONPath and
JSON Pointer are other query languages
([evaluate-queries](../evaluate-queries/task.md) and
[json-pointer-lookup](../json-pointer-lookup/task.md)).
See [shared methodology](../../README.md) for timing and reproduction.
