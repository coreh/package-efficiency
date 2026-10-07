# Wide dictionaries with toJSON values

One operation serializes a JavaScript value into JSON with object keys sorted
lexicographically (UTF-16 code unit order) at every level. This task differs
from `nested-records` in input shape: each of the 41 fixtures is a wide
dictionary of 20 to 300 keys (in a shuffled insertion order) whose values mix
strings, numbers, booleans, `Date` objects, class instances with a `toJSON()`
method, arrays, small nested objects and `undefined`. Sorting a large key set
dominates, and the serializer must apply `toJSON` and `undefined` rules the way
`JSON.stringify` does: `undefined` object members are omitted, `undefined`
array items become `null`, and `Date`/`toJSON` values are replaced by their
`toJSON()` result (which is then sorted too).

Expected bytes come from a separate oracle: `JSON.parse(JSON.stringify(x))`,
a recursive key sort, then `JSON.stringify`. Every result must match exactly.
Keys are non-integer-like strings, so JavaScript property order does not
interfere. Cycles, BigInt, replacers and indentation are out of scope.

Packages run with their default settings as installed. The inputs are built
once and reused; no adapter may cache or precompute outputs. The
standard-library baseline is left out: it would have to implement `toJSON`
handling itself around `JSON.stringify`.
See [shared methodology](../../README.md) for timing and reproduction.
