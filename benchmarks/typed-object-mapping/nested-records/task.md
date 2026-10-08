# Orders to records and back

One call takes a plain nested order (as parsed from JSON) and does both halves of the job: it builds declared record objects from it (`Order`, with a `Customer` record and a list of `Line` records), then dumps those objects back to plain data. Both halves are measured. The class declarations (schemas, dataclasses, derives) are made once, when the adapter loads; that is how each library is used.

Fields: `Order { id, ref, total, paid, note?, tags[], customer, lines[] }`, `Customer { name, age, score, active, nickname? }`, `Line { sku, qty, price, gift, comment? }`. Integers, floats, strings, booleans, optional strings (an explicit `null` when absent) and a list of strings, a nested record and a list of records. Floats always have a fraction, so integer-valued floats cannot be spelled differently across languages. There are 32 orders of 1 to 8 lines.

## Common result

Every adapter returns the pair `[record, plain]`: the record objects the library built, and the plain data it dumped from them. The adapters of Python, Ruby and Rust define `describe`, which turns the pair into the classes of the root, of the customer and of the first line, the customer's name, the number of lines and the first sku (all read from the objects), and the plain data. JavaScript is described in the scenario. `describe` is not timed.

## What counts as correct

- The objects are instances of the declared classes, named `Order`, `Customer` and `Line` at the three places checked. Returning the input unchanged fails this (the scenario asserts it on load).
- The name, line count and first sku read from the objects equal the input's.
- The plain data equals the input: no field added, dropped or retyped; key order is not compared. Every field is present in the input, so a library that omits null optionals would fail.

Accepted differences: the kind of object (class, dataclass, struct, Dry::Struct) and how it is declared. Plain-data keys may be symbols in Ruby (`to_h`).

Left out on purpose: dates. Libraries spell an ISO datetime differently (`Z` or `+00:00`, fractions) and Rust's serde_json has no datetime without another crate, so no field is a date.

## What differs between entries

- Rust's `serde_json` has no classes: derived structs are the records, `Order::deserialize(&Value)` reads the fixture without copying it, and `to_value` dumps.
- marshmallow builds objects through `@post_load` on schemas it validates with, and does more checking per field than the others. dry-struct checks strict types.
- Virtus is entered with its defaults and does not pass: `to_h` is shallow, so nested records come back as objects. It has no option for a recursive dump.
- Python and Ruby have no builtin entry (the standard libraries do not map plain data to declared classes), nor does Go: `encoding/json` would need a text round trip, a different job.

Left out of the task: `mapstructure`, `dacite` (they only load; no dump), `coercible`, `envconfig`, `proto-plus`, `py-serializable` (other jobs), `cattrs` and `mashumaro` (beyond the three most used PyPI packages that do the job).
