# Sorted map prefix scans

One operation takes `{ keys, lookups, prefixes }`. `keys` are distinct ASCII
strings (paths such as `order/417/beta/12`), 120 to 499 per case, in a shuffled
order; key `i` gets the value `i`. The operation builds an empty mutable sorted
map, inserts every key with its value one at a time, looks up each of 40 `lookups`
(a third of them absent), and for each of 11 `prefixes` lists the values of all
keys starting with that prefix, in ascending key order. The 40 cases include an
empty prefix (every key), a prefix with no match and prefixes cut mid-segment;
the last case is a small hand-checked one with mixed case.

A correct result is `[found, scans]`: `found[j]` is the value of `lookups[j]` or
`null`, and `scans[j]` is the list of values under `prefixes[j]` in key order.
Keys compare bytewise, which for ASCII is the same as comparing code units. The
expected results are computed in the scenario with a plain sort and compared
exactly, so a result in the wrong order or with a missing or extra value fails.

The whole build, lookup and scan is one timed call: the map is not reused between
calls. Packages run with default settings as installed and do the work their own
way: a sorted `Vec` (litemap) finds the start of a run by binary search, and a radix
trie walks to the prefix node. Results are mapped to
the common shape inside the call. Scale is small (hundreds of keys, not
millions) so every package, including the O(n) inserts of a flat sorted vector,
finishes quickly; findings do not extend to much larger maps.

Left out: zerotrie, which builds an immutable map from sorted data and has no
prefix iteration, and the JSR `@std/data-structures` red-black tree, which has
no range query: each prefix scan would walk the tree from its smallest key, so
most of its figure would come from a feature it does not have. No Python, Ruby, Go or JavaScript standard-library container
is both sorted and mutable, so there are no built-in adapters. See
[shared methodology](../../README.md) for timing and reproduction.
