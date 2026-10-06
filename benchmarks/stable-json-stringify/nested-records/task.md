# Stable nested JSON serialization

One operation serializes a nested JSON-compatible value, recursively sorting
object keys lexicographically and preserving array order. The 67 fixtures cover
nested objects/arrays, numbers, booleans, null, escaped quotes/newlines, Unicode,
and empty values. Expected bytes come from a separate recursive sorting oracle
followed by native JSON.stringify; every result must match exactly.

Scope excludes cycles, BigInt, undefined, toJSON, replacers and indentation.
Integer-like object keys are excluded because JS property enumeration and
lexicographic serializers can order these differently. No serializer is allowed
to precompute fixture outputs in its adapter.
See [shared methodology](../../README.md) for timing and reproduction.


## Rust comparison

All three adapters receive `serde_json::Value` with `preserve_order` enabled.
The supervisor exports the JavaScript scenario's exact inputs and expected
strings to `.cache/work/stable-json-stringify/nested-records/fixtures.json`.
Parsing happens before measurement, with `float_roundtrip` enabled so the JSON
transport preserves the JavaScript inputs' binary64 values. Original key order
is retained, including inside nested objects. No sorted or serialized outputs
are cached. Every adapter returns a newly allocated string on every call.

- `serde_json_canonicalizer` and `serde_jcs` use their own `to_string` entrypoints,
  including sorting and formatting in each call.
- `serde_json` clones the unsorted value, calls `sort_all_objects()`, and calls
  `to_string()`. Cloning, sorting, serialization and temporary destruction are
  all timed. This is the standard-library-API implementation of the task, not
  a claim that unconfigured `serde_json::to_string` sorts arbitrary inputs.

The fixed corpus uses ASCII keys and ordinary finite numbers. Passing these
fixtures is not certification of RFC 8785 support, nor a promise of identical
cross-language output for arbitrary Unicode keys or all numeric edge cases.
Plain serde_json's default number formatting can differ from JSON.stringify
outside this corpus; no expected bytes are relaxed to accommodate it.

Rust CPU uses `getrusage(RUSAGE_SELF)` user plus system time around each batch,
matching the definition of JavaScript `process.cpuUsage()`. The Rust runner is
single-threaded and uses the repo's counting allocator; its atomic allocation
tracking overhead is included in CPU measurements. Rust consumes string byte
length, JavaScript consumes UTF-16 code-unit length; both are constant-time
checksums, not extra output transcoding. Exact bytes are validated separately.
Rust uses `black_box` to prevent removal of measured work. Peak heap includes
fixtures and verification, as do the other whole-process memory figures.

Run the Rust entries sequentially:

```sh
node scripts/measure.mjs stable-json-stringify/nested-records --runtimes=rust
node --test harness/tests/operation.test.mjs harness/tests/rust-operation.test.mjs
npm run build
```

Dependency resolution must precede the release-age gate on a fresh checkout:
`cargo metadata --format-version=1 > .cache/cargo-metadata.json` updates the
lockfile without building. The measure command runs `check-cargo-age.mjs`
before its locked release builds. No benchmark jobs should overlap.

API references: [serde_json maps](https://docs.rs/serde_json/latest/serde_json/map/index.html),
[serde_json_canonicalizer](https://docs.rs/serde_json_canonicalizer/latest/serde_json_canonicalizer/),
and [serde_jcs](https://docs.rs/serde_jcs/latest/serde_jcs/).
