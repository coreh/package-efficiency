# Count occurrences, then retract

This is the update-heavy job of a hash map: a frequency table. One operation takes
`ints` and `strings` (streams of keys with many repeats) and `intRetracts` and
`stringRetracts` (keys to take away again). For each kind it uses a fresh, empty,
general-purpose hash map from key to integer count and does, in this order:

1. for every key in the stream, add one to its count (insert it with count 1 if it
   is new): one read-modify-write per event, most of them on keys already present;
2. iterate all entries and add up: the number of distinct keys, the largest count,
   the sum of count squared, and the sum of weight(key) times count (the key itself
   for integers, its length for strings);
3. for every key in the retract list, subtract one from its count if the key is
   present, and remove the entry when the count reaches zero; absent keys are
   ignored;
4. read the size, and iterate again to add up the remaining counts.

The result is a list of 12 integers: six for integers, then the same six for
strings: distinct keys, largest count, sum of squares, weighted sum (step 2), size
after step 3, remaining total (step 4). The check compares every number exactly
against a reference computed when the fixtures are built. A wrong count, a missed
removal or an ignored retract changes at least one number.

The 40 cases have between 24 and 400 events of each kind drawn from skewed
vocabularies (a few hot keys and a long tail): sequential and scattered integers
(some negative, some above 2^31), ASCII words, URL paths and hex ids. The retract
lists mix keys that occur, keys that occur only once (so they vanish) and keys that
never occurred.

Accepted differences: iteration order does not matter (only sums and maxima are
used), so insertion-ordered and unordered maps are interchangeable. Packages run
with their default settings as installed (default hasher, no reserved capacity).
The map is created inside the call, so construction and growth are measured,
and with at most 400 events over 8 to 97 distinct keys they are a large part of
every figure. The sibling `insert-lookup-remove` task also builds a fresh small
map per call, so the two tasks are likely to rank entries the same way.

The Rust crates differ in their default hasher, and much of their ranking is
the hasher: `hashbrown` and `hashlink` hash with foldhash, `indexmap` with
the standard library's `RandomState` (SipHash).

Every Rust adapter uses the entry API for both the count and the retract (one
lookup each); Go counts with `m[k]++`; the other languages use get and set.

Not covered: non-primitive keys, very large maps, ordering guarantees, bounded
caches and multi-maps. `dashmap` is not included: it is a concurrent map, and
building one per small single-threaded call measures the construction of its
shards, not this job.
