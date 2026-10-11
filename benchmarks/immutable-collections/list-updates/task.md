# Immutable list updates

One operation takes `{ items, ops }`. `items` are 40 to 229 integers (some
negative, some zero). The operation creates an immutable list holding those
items in one step, with the library's own from-array constructor, then applies
300 to 500 `ops` in order, each on the list the previous op produced, so the
updates and reads are nearly all of the work. An op is `[kind, index, value]`:
`set` replaces the element at `index`, `insert` puts `value` at `index` (which
may be the current length), `remove` deletes the element at `index`, and `get`
reads the element at `index`. Indices are always valid when the op runs. The
four mixes are read-heavy, replace-heavy, insert/remove-heavy and mostly
reads. The last two cases are small hand-checked ones (12 and 10 ops): an
empty start, a list emptied and refilled, and first and last positions.

A correct result is `[finalList, gets]`: the elements of the last version in
order and the values read by `get` ops in order. Expected results are computed
in the scenario with plain array copies and compared exactly.

The creation and the whole update sequence are one timed call. Packages run
with their default settings as installed and are used the way their
documentation shows: Immer's `produce` with a mutating recipe on a plain array
(one `produce` that pushes all the items into an empty draft, then one per
op); `@oxi/list`'s `List.from`, `replaceAt`, `insertAt`, `removeAt` and `at`;
`pyrsistent`'s `pvector`, `set`, `delete` and indexing, with an insert written
as `lst[:i].append(v).extend(lst[i:])` because `PVector` has no insert. Each
step's new version is what the next step starts from; no version is cached
between calls. Results are mapped to the common shape inside the call:
`@oxi/list` returns its list type and `Option` values, so the adapter calls
`toArray()` and `unwrap()`; the final `PVector` becomes a list; Immer already
yields plain arrays.

Different work for the same job: Immer (a copy of the array per `produce`,
plus freezing the result by default) and `@oxi/list` (a full array copy per
update) are not persistent trees with structural sharing, so every update is
O(n). `pyrsistent`'s `PVector` is a persistent tree that shares structure;
its insert is built from two slices and an `extend`. The built-in adapters start from one copy of
`items` (`slice()`, `tuple(items)`, `dup.freeze`, a Go slice copy) and copy the
array on each update in the language's own way (JavaScript `with` and
`toSpliced`, Python tuples, Ruby frozen-array concatenation, Go slices). Scale
is small (hundreds of elements), and findings do not extend to large
collections.

Left out: Immer's `Map`/`Set` support and nested draft updates, which this
flat-list task does not exercise.

See [shared methodology](../../README.md) for timing and reproduction.
