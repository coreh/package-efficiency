# Insert, remove and read by key

One operation builds a fresh container of `u32` values and runs this script:

1. insert `first` values, keeping the key each insert returns;
2. remove every second one (positions 0, 2, 4, ...) by key;
3. insert `extra` more values, keeping their keys;
4. read every live value by key: first the surviving keys of step 1 in order,
   then the keys of step 3.

Value number `i` (counting across both insert phases) is
`(i * 2654435761 + seed) mod 2^32`. The result is
`{ live, sum, mix }`: `live` is the container's own length after step 3 (for
`sharded-slab`, which the adapter asks for no length, the number of keys the
adapter still holds, so there `live` does not test the container), `sum`
the sum of the values read back, and `mix` a position-sensitive fold
(`mix = mix * 31 + value`, wrapping at 32 bits) over the values in the read
order above. Expected results are computed in `scenario.mjs` from a plain model
of the script, not from any library. A container that ignores removals, returns
wrong values for keys, or does not hold the values fails `live`, `sum` or `mix`.

36 fixtures, from 200 to 24,000 first-phase inserts, with differing extra counts
and seeds. Keys are whatever the container hands out (integer indices or
generational handles); the adapter keeps them in a `Vec` in every case. Reuse of
vacated slots is allowed but not required.

Scope: Rust crates only (no npm or JSR package in this category). `id-arena`
is left out because it cannot remove values. Packages run with default
settings as installed: `slab::Slab::new()`, `slotmap::SlotMap::new()` (default
key type), `sharded_slab::Slab::new()`. `sharded-slab` is a concurrent slab and
is used here through its single-threaded call path; its `get` returns a guard,
which is dereferenced for the value. The timed output is a small struct read
through its fields; there is no serialization.
See [shared methodology](../../README.md) for timing and reproduction.
