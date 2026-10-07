# Insert, look up, iterate, remove

One operation takes four lists: `ints` (integer keys), `intProbes`, `strings` (string
keys) and `stringProbes`. For each kind it uses a fresh, empty, general-purpose hash
map from key to integer and does, in this order:

1. insert every key, with the key's position in the list as its value (a repeated
   key keeps the value of its last position);
2. look up every probe and count the hits and add up the values found;
3. iterate all entries and add up the keys (the key itself for integers, its length
   for strings) and the values;
4. remove the keys at even positions (0, 2, 4, ...) of the key list;
5. read the size, then look every probe up again and count the hits.

The result is a list of 14 integers: the seven numbers below for integers, then the
same seven for strings: size after step 1, hits, sum of values found (step 2), sum of
keys, sum of values (step 3), size after step 4, hits after step 4. The check compares
every number exactly against a reference computed when the fixtures are built.

The 40 cases have between 4 and 160 keys of each kind: sequential and scattered
integers (some negative, some above 2^31), ASCII strings that look like user ids,
URL paths and hex digests, repeated keys, and probes that are half present and half
absent. Keys are never mixed inside one map. A full run of a million keys is not
possible here, because one operation must stay a small synchronous call; the sizes
are what a request-sized map looks like.

Accepted differences: iteration order does not matter (sums are used), so
insertion-ordered maps and unordered ones are interchangeable. Packages run with their
default settings as installed (default hasher, default capacity: no `with_capacity`,
no reserve). A map is created inside the call, so construction and growth are
measured. Concurrent maps are used from one thread.

Not covered: non-primitive keys, very large maps, ordering guarantees, bounded caches,
and memory-per-entry at scale. The strings are ASCII so that length is the same in
every language.
