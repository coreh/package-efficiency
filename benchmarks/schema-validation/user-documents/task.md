# Nested user documents

One operation validates one JSON document and returns a boolean: valid or not.
The schema is declared once per adapter, outside the measured call, in the
library's own documented style (JSON Schema for Ajv and the Rust crate, builder
objects for Zod, TypeBox and Valibot). Libraries that compile a schema do so
once at setup; the measured call is the validation only. No results are cached.

The schema describes a user: `id` (integer, at least 1), `name` (string, at
least 1 character), `email` (string), `role` (one of `admin`, `editor`,
`viewer`), `active` (boolean), `tags` (array of strings), `scores` (array of
numbers), an optional `nickname` (string), and an `address` object with `city`
(non-empty string), `zip` (string) and an optional `geo` object with `lat`
(-90 to 90) and `lng` (-180 to 180), both required inside `geo`.

The 72 fixtures are built without randomness: three in four are valid
(with variation in optional fields and array lengths); the others each break
exactly one of 18 rules, such as a wrong type, a missing required nested field, a
value out of range, an unknown enum member, a wrong item inside an array, `null`
where an object is required, or an empty required string. Expected booleans come
from fixture construction and are asserted exactly.

Accepted equivalences: unknown extra properties are not exercised (some libraries
strip them and others allow them), and neither are non-BMP characters (string length
is counted in UTF-16 units by some libraries and code points by others), formats,
patterns and coercion. Only the boolean outcome is compared. Each adapter uses the library's
boolean check where it has one (Ajv's compiled validator, TypeBox's compiled
`Check`, Valibot's `is`, the Rust crate's `is_valid`); Zod has none, so its
`safeParse` also builds an issue list for the invalid documents. Packages run with their default settings as installed, except that the Rust
`jsonschema` crate is built without its default features. Those add fetching
of remote and file references (with a TLS backend) and idna for the
internationalized hostname and email formats; this schema uses none of them.
The entry is tagged as using non-default options.
Rust receives the same documents as `serde_json::Value`.

See [shared methodology](../../README.md) for timing and reproduction.
