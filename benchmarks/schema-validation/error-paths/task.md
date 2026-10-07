# Locating the first error

One operation validates one JSON document and returns a string: the path of the
first validation error as a slash-separated pointer such as `/address/geo/lng`
or `/tags/3`, or the empty string when the document is valid. This measures the
failure path of a validator: building an error, with its location, for a
document that is wrong. A missing required property is reported at the property
itself (`/email`), so each adapter maps its library's error to that one shape
inside the measured call (Zod and Valibot join their path array, Ajv adds the
missing property to its `instancePath`, TypeBox reports the path directly, and
the Rust crate combines `instance_path` with the `Required` property).

The schema is the same as in the `user-documents` task: a user with `id`
(integer, at least 1), `name` (non-empty string), `email`, `role` (one of three),
`active`, `tags`, `scores`, an optional `nickname`, and an `address` with `city`,
`zip` and an optional `geo` with `lat` and `lng` (both required, in range). It is
declared once per adapter outside the measured call, in the library's own
documented style, and compiled once where the library compiles. No results are
cached.

The 72 fixtures are built without randomness. Eight are valid; the other 64 each
break exactly one of 18 rules (wrong type, out of range, missing nested field,
unknown enum member, a wrong array item, `null` or a string where an object is required, and
so on), each rule several times on different base documents. Because only one
rule is broken, every library finds exactly one error, so "first" does not depend
on the order in which libraries check things. The expected pointer for each
fixture is asserted exactly, so returning a constant or a plain boolean fails.

Accepted equivalences: only the pointer string is compared, not messages or
codes. Unknown extra properties, non-BMP strings, formats and coercion are not
exercised. Ajv runs with its default (stop at the first error); Zod and Valibot
collect all issues, as they do by default, and the adapter reads the first.
Packages run with default settings as installed, except that the Rust
`jsonschema` crate is built without its default features. Those add fetching
of remote and file references (with a TLS backend for it) and the `idna`
support behind the `idn-hostname` and `idn-email` formats; this schema uses
none of them. The entry is tagged as using non-default options.

See [shared methodology](../../README.md) for timing and reproduction.
