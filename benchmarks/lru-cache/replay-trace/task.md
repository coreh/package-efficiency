# Replaying an access trace

One operation builds a new LRU cache with the fixture's capacity and replays its
list of integer keys in order. For each key the adapter asks the cache for it
(a read, which counts as a use); on a miss it inserts the key with a constant
value, evicting the least recently used entry if the cache is full. The result
is the number of hits, a plain integer.

The 36 fixtures are six trace shapes (skewed popularity, uniform, a cyclic scan
one larger than the capacity, a cyclic scan that fits, a hot set mixed with
one-off keys, and a working set that shifts midway) at six capacities from 1 to
64, each 240 lookups long. A reference implementation in `scenario.mjs` fixes
the exact expected hit count of every fixture, and the check is exact: a cache
that is only approximately LRU, or that does not refresh recency on a read,
gives different counts and fails.

Creating the cache is part of the timed call in every language, so each
operation is self-contained and no state carries between calls. Packages run
with their default settings as installed, only given the capacity they require.
Only the hit count is accepted from each adapter; whether a package keeps
entries as a map, a linked list or a slab is its own business.

Scope: single-threaded, in-memory, size-bounded caches. Packages with
time-based expiry, weighted sizes, admission policies or concurrency (such as
frequency-based caches that are not strict LRU) are out of scope. Memoization
helpers are not included.
