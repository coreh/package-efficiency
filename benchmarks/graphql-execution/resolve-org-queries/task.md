# Query against an in-memory schema

One operation takes a GraphQL query (a string of about 100 characters) and
returns the `data` of its response: the library parses the query, validates it
against the schema and executes it against in-memory data. The 32 queries ask
for an organization with its teams, their tags and their members, and resolve
about 40 to 130 fields each. They use aliases, a named fragment, `__typename`,
`@skip(if: true)` and `@include(if: false)`; one asks for an organization that
does not exist and gets `null`.

The schema (five types and an enum) and the data (3 organizations, 4 teams
each, 6 members each) are built in the adapter's module, outside the timed
call, the same way in every language. The only resolver written by hand is
`Query.org(id)`, a lookup. Every other field is read by the library's default
resolver (a property, a dict key, a hash key) or, in Go and Rust, by the
field accessor the library requires.

## What counts as correct

The result must equal the data the scenario computes from the query, in full:
every key, value and nested list. Libraries return their own object kinds, so
the check reads the result through JSON first; nothing else is relaxed. A
response with errors is a failure: the adapter raises on it.

Each adapter uses the library's one-call entry point with default options:
`graphqlSync` (graphql-js), `graphql_sync` (graphql-core), `Schema.execute`
(graphql-ruby), `Schema.Exec` (graph-gophers/graphql-go) and
`juniper::execute_sync`. All of them parse and validate before executing.

## Packages

- `graphql` (npm), `graphql-core` (PyPI), `graphql` (RubyGems),
  `graph-gophers/graphql-go` (Go) and `juniper` (crates.io).

Left out: `gqlparser` (Go) only parses and validates, and has no executor;
`async-graphql` (crates.io) only offers an asynchronous `execute`; there is no
GraphQL in any standard library, so there are no `builtin/` adapters. Client
libraries and server integrations do not execute a schema in-process.

See [shared methodology](../../README.md) for timing and reproduction.
