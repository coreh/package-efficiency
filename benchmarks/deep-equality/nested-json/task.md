# Nested JSON equality

One operation compares a pair of values. The 67 cases include distinct but equal
nested objects, early primitive differences, deep array differences, missing
nested properties, reordered object keys, null, and array/object mismatches.
Each expected boolean is specified by fixture construction and asserted exactly.

Scope: JSON-compatible values. Cycles, prototypes, Map/Set, typed arrays, Dates,
NaN, signed zero and custom classes are excluded; libraries differ on these.
The 64 primary pairs contain one equal and three unequal variants per group.
See [shared methodology](../../README.md) for timing and reproduction.

Rust's `serde_json::Value::PartialEq` adapter compares separately parsed values;
parsing and fixture verification are outside timing. The timed output is a
boolean, consumed directly without serialization or string allocation.
`preserve_order` keeps input key order; equality still ignores object key order.
This corpus does not exercise integer-versus-floating-point representations
such as `1` versus `1.0`, which serde_json distinguishes.
