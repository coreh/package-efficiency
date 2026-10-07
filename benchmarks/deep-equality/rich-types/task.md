# Maps, Sets, Dates and typed arrays equality

One operation compares a pair of values. The 72 cases are records holding Dates,
RegExps, Sets of primitives, Maps (primitive keys, object/array values), Uint8Array,
Float64Array, NaN and nested Map/Set/Date, in equal pairs and in pairs that differ
by one thing (a Date by 1 ms, regexp flags, an extra Set member, one Map value,
one byte, one float, a nested Set member), plus a few direct Map/Set/Date/NaN pairs.
Expected booleans come from fixture construction and are asserted exactly.

Accepted as equivalent: Map and Set order is ignored by all packages; NaN equals NaN.
Excluded because libraries differ: NaN inside typed arrays, signed zero, Sets of objects, objects as Map keys,
cycles, prototypes, class instances and boxed primitives.

Packages run with default settings as installed. `fast-deep-equal` (default
entry point) and `deep-is` do not compare Map, Set or Date contents and are left out;
`fast-deep-equal/es6` is a separate entry point, not a setting, and is also not included.
