# Nested option objects

One operation takes a list of four source objects (defaults, a preset, user
options and overrides) and returns one new object in which later sources win and
nested objects are merged recursively. The 36 cases are built deterministically
and cover nested objects three to four levels deep, a scalar replaced by an
object, an object replaced by a scalar, `null`, `false`, `0` and `''` overriding
earlier values, empty objects, and non-ASCII keys and strings.

Scope: plain objects whose values are strings, numbers, booleans, `null` or
other such objects. Arrays, `undefined`, Dates, Maps, Sets, class instances,
getters and the `__proto__` key are excluded, because libraries deliberately
differ on them (concatenating, merging by index or replacing arrays, for
example). Each expected result comes from a plain reference merge in the
scenario and is compared strictly. Key order is not part of the contract. The
check also requires that the source objects are not modified, so each adapter
merges into a fresh `{}` or uses a library that returns a new object.

Packages run with their default settings as installed. Libraries that need a
flag to recurse (`extend`'s leading `true`) are called the way their
documentation shows deep merging. Adapters return what the library returns;
nothing is serialized or walked. See [shared methodology](../../README.md) for
timing and reproduction.

No standard library in the benchmarked languages has a recursive object merge,
and the brief lists no crates, so only npm and JSR packages are included.
