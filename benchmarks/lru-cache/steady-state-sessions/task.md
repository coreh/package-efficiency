# Session cache with invalidation

One operation builds a new LRU cache with the fixture's capacity and walks a
list of 5,000 string keys (session-style names such as `session:3k9x2a`, some
with a padded suffix). Operation number `i` (counting from 0) removes its key
when `i % 11 == 10`; otherwise it reads the key (a use that refreshes recency),
and on a miss stores the operation index as the value, evicting the least
recently used entry if the cache is full. The result is four numbers: reads
that hit, the sum of the values returned by those hits, removals that found an
entry, and the entry count at the end.

This differs from `replay-trace`: traces are long and the capacities large
(100 to 3,000), so the steady-state cost of lookups, evictions and removals
dominates rather than cache creation; keys are strings, not small integers;
values are stored and read back; and explicit removal is part of the job.

The 24 fixtures are four trace shapes (skewed popularity, uniform over twice
the capacity, a hot set mixed with one-off keys, a working set that shifts
midway) at six capacities. A reference implementation in `scenario.mjs` fixes
the exact expected result of every fixture and the check is exact, so a cache
that is not strictly LRU, that does not refresh recency on a read, that loses
values or that mishandles removal fails.

Packages run with their default settings as installed, only given the capacity
they require. Creating the cache is inside the timed call in every language.
Rust adapters borrow the keys from the input rather than copying them, as
JavaScript strings are shared references. Whether a package keeps entries as a
map, linked list or slab is its own business.

Left out: `@alloc/quick-lru` is a two-generation approximation, not strict LRU,
and gives different hit counts; `moka` uses an admission policy and is not LRU;
`lru-slab` is slot storage with no key lookup.
