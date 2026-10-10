# Union, intersection and difference of integer sets

This is the set job of a hash table. One operation takes two lists of integers,
`a` and `b`, each with repeated values, and with the library's general-purpose
set type does, in this order:

1. build a set from `a` and a set from `b` (repeats collapse);
2. compute their union, their intersection and the difference `a - b`, each as
   a new set of the library's own type.

The result is the list of the three sets, `[union, intersection, difference]`,
as the library returns them: no sorting, no conversion to a list inside the
call. For the check, a Python, Ruby or Rust adapter's `describe` turns each set
into a list (once per fixture, outside the timing), a Go set is marshalled with
`encoding/json`, and a JavaScript `Set` is read directly. The verifier sorts
each list and compares it exactly with the scenario's own answer, computed with
built-in Sets and plain loops when the fixtures are built. A missing or extra
member, a repeated member, the lists concatenated instead of a union, `b - a`
instead of `a - b`, intersection and difference swapped, and another fixture's
answer are all refused; the scenario asserts this for every fixture when it
loads.

The 40 cases have 8 to 400 integers in each list, about three quarters of them
distinct, in scrambled order: sequential integers from a small base, scattered
integers (some negative), multiples of 4096, and integers above 2^31 (all exact
in a double and in a 64-bit integer). Most cases overlap partly (from one shared
value to nine tenths of them); the others are the edges: `a` and `b` disjoint
(empty intersection), `b` inside `a`, `a` and `b` equal as sets (empty
difference), and `b` empty.

Accepted differences: the order of members in a set is not compared (the
verifier sorts), so hash sets, insertion-ordered sets and sorted sets are
interchangeable. Packages run with their default settings as installed (default
hasher, no reserved capacity). All five sets are created inside the call, so
construction and growth are measured, and with at most 400 members they are a
large part of every figure.

Different work for the same job: `ordered-set` keeps insertion order (a list
beside a dict) and `sorted_set` keeps sorted order (a red-black tree from the
`rbtree` gem), so both do more than a hash set, and their figures include it.
That is their normal way and they are measured as they are. `golang-set`'s
`NewSet` is its thread-safe set, which takes a lock on every call; that is the
package's default and is measured as it is.

## Entries

- JavaScript `Set` (builtin `js-set-methods`): `new Set(a)`, `new Set(b)`, then
  `union`, `intersection` and `difference` (ES2025; Node 22+, Bun, Deno 2).
- Python `set` (builtin `python-set`): `set(a)`, `set(b)`, then `|`, `&`, `-`.
- Ruby `Set` (builtin `ruby-set`): `Set.new(a)`, `Set.new(b)`, then `|`, `&`,
  `-`.
- `ordered-set` (PyPI): `OrderedSet(a)`, `OrderedSet(b)`, then `|`, `&`, `-`.
- `sorted_set` (RubyGems): `SortedSet.new(a)`, `SortedSet.new(b)`, then `|`,
  `&`, `-`.
- `github.com/deckarep/golang-set/v2` (Go): `mapset.NewSet[int](a...)`,
  `mapset.NewSet[int](b...)`, then `Union`, `Intersect`, `Difference`.
- `hashbrown` (Rust): `HashSet<i64>` collected from each list, then
  `union`, `intersection`, `difference`, each collected into a new `HashSet`.
- `indexmap` (Rust): the same with `IndexSet<i64>`.

## Left out

- `@vicary/flushable-set`: a subclass of the built-in `Set` that adds a flush
  callback; its set algebra is the built-in `Set`'s, already an entry.
- Go's standard library: it has no set type. A `map[int]struct{}` with the
  three loops written out would be the job written by hand, not a library
  function.
- Rust's `std::collections::HashSet`: there is no way yet to list a Rust
  standard-library entry. `hashbrown` is the table behind it.
- Symmetric difference, subset tests and string members: not in the job, so the
  entries are compared on one shape of work.
