# Statements to a syntax tree

One operation parses one SQL statement (a string of 50 to 800 characters) with
the library's parser. The 64 statements are generated deterministically:
SELECT (half of them) with one to three tables joined, aliases, aggregates,
`CASE`, `GROUP BY`, `HAVING`, `ORDER BY` and `LIMIT`; INSERT with one to 13
rows of values; UPDATE; DELETE; and CREATE TABLE with 11 columns. They
stay inside the SQL that MySQL, PostgreSQL and the generic grammars all read:
no quoted identifiers, no dialect functions, single-quoted strings only.

## What counts as correct

Every parser has its own tree, and none of them is compared with another
directly. Each adapter reads its library's tree into one small common shape,
inside the timed call, and the verifier compares that with what the generator
knows it wrote:

```
{ kind, tables, columns, items, where }
```

- `kind`: `select`, `insert`, `update`, `delete` or `create_table`
- `tables`: the tables read or written, in order (the joined ones too)
- `columns`: the columns inserted into, assigned or defined, in order
- `items`: the number of result columns of a SELECT, of rows of an INSERT
- `where`: the WHERE condition as a tree, `null` when there is none:
  `[operator, left, right]` for `AND`, `OR`, `=`, `<>`, `<`, `>`, `<=`, `>=`
  and `LIKE`; `['col', table or null, column]`; `['num', integer]`;
  `['str', text]`

The condition is where a parser shows that it built a tree and did not just
split the text: conditions have up to seven comparisons joined by `AND` and
`OR`, with parentheses only where precedence needs them and now and then where
it does not. A parser that groups `a OR b AND c` as `(a OR b) AND c` fails.

Accepted as equal, because they are a library's way of writing the same tree:
operator names in upper or lower case, and `!=` for `<>`; a string literal
with its doubled quote resolved (`O'Brien`) or kept as written (`O''Brien`);
a chain of `AND`, or of `OR`, grouped to the left or to the right (both are
associative; the verifier flattens chains before comparing); parenthesized
expressions kept as nodes or dropped (the adapter steps through them).
Everything else must match exactly.

The mapping an adapter does is a few property reads per node of the WHERE
condition and one pass over a list or two; it is the same amount of work in
every adapter, in JavaScript and Rust alike, and the parse dominates. Rust
builds the common shape as a struct inside the call; turning it into JSON for
the verifier is outside it. The select list, the join conditions, the VALUES
rows, column types and constraints are parsed by every library but only
counted, not compared.

## Packages

Each runs with default options, the way its documentation shows.

- `node-sql-parser`: `new Parser()` once, `astify(sql)` per call (the default
  grammar is MySQL). Not passing: it groups a mixed `AND`/`OR` condition left
  to right, so `a = 1 OR b = 2 AND c = 3` comes back as
  `(a = 1 OR b = 2) AND c = 3`. Seven fixtures have such a condition.
- `pgsql-ast-parser`: `parseFirst(sql)` (PostgreSQL grammar).
- `sql-parser-cst`: `parse(sql, { dialect: 'postgresql' })`; the dialect is a
  required option. It returns a concrete syntax tree that keeps every keyword,
  which is more work than an abstract tree and is its normal output.
- `sqlparser` (Rust): `Parser::parse_sql(&GenericDialect {}, sql)`.

Not included yet: PyPI `sqlglot`, `sqlparse` and `py-partiql-parser`, and
RubyGems `pg_query`, which can be added when those registries can supply
adapters. `sqlparse` does not build a tree of the condition, so it would be
recorded as not passing. `pgsql-parser` (npm) wraps the PostgreSQL parser
compiled to WebAssembly and needs an asynchronous load.

See [shared methodology](../../README.md) for timing and reproduction.
