# Insert and select in an in-memory database

Each call opens a new in-memory SQLite database, creates
`items (id INTEGER PRIMARY KEY, name TEXT NOT NULL, score REAL NOT NULL, flag INTEGER NOT NULL, note TEXT)`,
inserts every row of the fixture (200, 500 or 1,000 rows) inside one transaction
with one prepared statement, and runs
`SELECT id, name, score, flag, note FROM items ORDER BY score, id`, decoding every row.
The database is closed at the end of the call. Opening, creating, inserting,
selecting and closing are all timed: that is the whole job of a client.

The input is the list of rows as parsed JSON. Where a binding wants typed values
(Go, Rust), `prepare` converts them once, outside the timed work.

The fixtures are chosen so that the work cannot be skipped. Ids are integers
above 2^32 (64-bit), names carry non-ASCII text, scores are reals that are never
whole numbers, notes are text or null, and the rows are inserted in an order
that is neither the id order nor the score order. The check requires the exact
rows back, ordered by score then id, with the right types (an integer id, text,
a real, a flag of 0 or 1, text or null).

## What counts as correct

- A row may be an array of five values or an object with the five column names
  in column order (the library's own row type); the verifier reads both.
- Whole-valued reals cannot occur, so a JSON round trip of the native
  runtimes does not lose the distinction between integer and real.

## Left out

- Packages that fetch a native library at run time (JSR `@db/sqlite`),
  packages that need an install script or a build to produce a binary
  (`better-sqlite3`), and asynchronous APIs (`aiosqlite`).
- Object-relational mappers and query builders.
- Blob columns: JSON fixtures cannot carry them without a conversion that each
  language would do differently.
