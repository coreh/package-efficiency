# Insert models and query them back

One operation works on an empty in-memory SQLite database. It creates the
table of one declared model, `User(id, name, city, age, score)`, inserts 60 to
360 rows (24 fixtures, generated deterministically, with accented and
apostrophe-bearing text), and loads back the users with `age >= minAge` and
`city <> skipCity`, ordered by `score` descending and then `id` ascending.
Scores come from a small range, so many users tie and the order is decided by
the id. Between 60% and 80% of the rows come back.

The model is declared once, the way each library's documentation shows (a
class, a struct, a table object). The database is opened once, when the
adapter loads, as an application would; each call then creates the table,
inserts, queries and drops the table, so every call starts from an empty
database and the ids are assigned by the database (1, 2, 3, ... in insertion
order).

## What counts as correct

The common result is a list of `[id, name, city, age, score]`, built from the
objects (or rows) the library returns, inside the timed call, in every
language alike. The verifier compares it exactly with what the scenario
computes from the fixture: the same rows, the same order, integer ids, scores
and ages, text unchanged. A result that ignores the filter, the order or the
tie-break, or that takes its ids from anywhere but the database, fails.

The packages differ in how they get there, and each is measured as its
documentation shows:

- **Insert:** the library's batch insert, one call for all the rows:
  SQLAlchemy and SQLModel `add_all` of `User` objects and `commit`; peewee
  `bulk_create` of `User` objects (batches of 100) in a transaction; gorm
  `Create(&users)` of a slice; drizzle `insert().values(rows)`; diesel
  `insert_into().values(&rows)`; ActiveRecord `insert_all` and Sequel
  `multi_insert`, which take hashes and not model objects. `jinzhu/gorm` has no
  batch insert, so it creates the objects one by one in a transaction.
- **Create the table:** through the library where it has a call for it
  (SQLAlchemy and SQLModel `create_all`, peewee `create_tables`, gorm
  `AutoMigrate`, ActiveRecord and Sequel `create_table`). Drizzle and diesel
  create tables only offline, through their command-line tools, so they run the
  `CREATE TABLE` statement as raw SQL.
- **Query:** the library's own query builder; the rows come back as model
  objects (diesel: a `Queryable` struct) and are read into the common list.

Reading the fixture's JSON into plain rows is not timed (`prepare` in Go and
Rust). Building model objects from those rows is, where the library takes
objects.

## Packages and the SQLite underneath

The libraries do not use the same SQLite: Python uses its `sqlite3` module,
ActiveRecord and Sequel the `sqlite3` gem, gorm the cgo driver of
`mattn/go-sqlite3`, diesel a bundled copy through `libsqlite3-sys`, and
drizzle `sql.js`, SQLite compiled to WebAssembly (the only synchronous SQLite
binding for Node, Bun and Deno that does not need a native build). Part of the
difference between languages is therefore the engine and not the mapping layer.

- `drizzle-orm` (npm): `drizzle-orm/sql-js`.
- `sqlalchemy`, `peewee`, `sqlmodel` (PyPI). SQLModel is a layer over
  SQLAlchemy and pydantic; it has no PyPy build.
- `activerecord`, `sequel` (RubyGems).
- `gorm.io/gorm`, `github.com/jinzhu/gorm` (Go).
- `diesel` (crates.io).

## Left out

- npm `sequelize`, `typeorm`, `knex`, `kysely`, `@mikro-orm/*`, `prisma`: their
  API is asynchronous (promises), which a synchronous task cannot measure.
  `better-sqlite3` and `sqlite3` need a native build at install.
- crates `sea-orm`, `rbatis`, `ormlite`, `toasty`: asynchronous.
- `go-wordwrap`, listed in the category's brief, is a word-wrapping library and
  not an ORM.
- No standard-library adapter: no language's standard library maps models to
  tables. A raw `sqlite3` driver would be another job.
- Servers (PostgreSQL, MySQL) are out; every entry uses SQLite in memory.

See [shared methodology](../../README.md) for timing and reproduction.
