# Sorted map deletes and full ordered scan

One operation takes `{ keys, removals }`. `keys` are distinct ASCII strings
(session, order and cache style paths such as `orders/417/beta/12`), 600 to
2,300 per case, in a shuffled order; key `i` gets the value `i`. `removals` lists
keys to delete: about 40% of the keys in another shuffled order, plus a few keys
that were never inserted and a few keys repeated, so some deletes find nothing.
The operation builds an empty mutable sorted map, inserts every key with its
value one at a time, deletes each removal key in order, and then reads the values
of all remaining keys in ascending key order.

A correct result is `[removed, ordered]`: `removed[j]` is `true` when the delete
of `removals[j]` removed a key (and false when the key was absent or already
gone), and `ordered` is the list of values of the remaining keys in ascending
bytewise key order. Keys compare bytewise, which for ASCII is the same as code
unit order. Expected results are computed in the scenario with a plain sort and
compared exactly, so a wrong order, a delete that left a key behind or removed
the wrong one, or an adapter that skips the work fails.

This differs from the prefix-scans task: it measures delete (rebalancing in a
tree, shifting in a flat vector, pruning in a trie) and a whole-map in-order walk,
not lookups or prefix ranges. The whole build, delete and walk is one timed call;
the map is not reused. Packages run with default settings as installed. Each
adapter maps its result to the common shape inside the call: a boolean from the
delete's return, and the values collected during iteration.

The JSR red-black tree is a set of items, not a map: each item is a small
`[key, value]` pair and the tree is given a comparator that compares keys
bytewise (it has no default for such items); a delete passes a probe pair.
Pair allocation is part of the call. Scale is moderate (thousands of keys), so
findings do not extend to millions.

Left out: zerotrie, which builds an immutable map from sorted data and cannot
delete. No Python, Ruby, Go or JavaScript standard-library container is both
sorted and mutable, so there are no built-in adapters. See
[shared methodology](../../README.md) for timing and reproduction.
