# u64 keys in the standard HashMap, by hasher

This task compares hashers, not maps. Every entry builds the same map type,
Rust's `std::collections::HashMap<u64, u64, S>`, and only the `BuildHasher` `S`
comes from the crate. One operation takes `keys` and `probes` (unsigned 64-bit
integers, written as decimal strings because most do not fit a JSON number
exactly; reading them into a `Vec<u64>` is done in `prepare` and not timed) and,
on a fresh, empty map created with `S::default()`, does in this order:

1. insert every key, with the key's position in the list as its value (a
   repeated key keeps the value of its last position);
2. look up every probe, count the hits and add up the values found;
3. remove the keys at positions 0, 3, 6, ... of the key list, counting the
   removals that found an entry (a repeated key is found only once).

The result is five integers: the size after step 1, the hits, the sum of the
values found, the removals that found an entry, and the size after step 3. The
check compares all five exactly against a reference computed in `scenario.mjs`
with a JavaScript `Map` over `BigInt` keys. A map that loses a key, finds one
it should not, or ignores a removal changes at least one number; the scenario
asserts when it loads that keys read as doubles (which merge keys above 2^53),
ignored removals, a missed or extra hit and another fixture's answer are all
refused.

The 48 cases have 16 to 768 keys, in six styles that each come in eight sizes:
sequential integers from a small base; random 64-bit integers; multiples of
2^12; multiples of 2^16; multiples of 2^32; and integers counting down from
2^64 - 1 in steps of 256. The probes are as many as the keys, half of them
present and half absent keys of the same style, so misses land in the same
buckets as hits. Every fourth case repeats an eighth of its keys.

The power-of-two styles are there on purpose. The standard map picks a bucket
from the low bits of the hash and a tag from the top seven bits, so a hash
that leaves the low bits of such keys at zero (the identity hash of
`nohash-hasher`, a single multiply as in `fxhash`) puts many keys in one
bucket and probing turns quadratic. That is a real cost of those hashers on
such keys, and it is in their figures; on sequential keys the same hashers
are the fastest. Read the per-style behaviour in the crates' own
documentation before reading one figure as a general ranking.

Accepted differences: none in the output. The map is created inside the call
with the hasher's `Default` (no `with_capacity`, no reserve), so construction,
growth and the hasher's own seeding are measured. Randomly seeded hashers
(`ahash`, `foldhash`) seed each map the way their `Default` does; fixed-key
hashers (`fnv`, `fxhash`, `rustc-hash`, `seahash`, `siphasher` with zero keys,
`nohash-hasher`) do no seeding. No entry is hardened against collision
attacks beyond what its default gives; the task does not judge that.

## Rust entries

- `ahash`: `HashMap<u64, u64, ahash::RandomState>` (the standard map with
  ahash's state, not the `AHashMap` wrapper), `default()`.
- `rustc-hash`: `rustc_hash::FxHashMap<u64, u64>` (an alias of the standard
  map with `FxBuildHasher`), `default()`.
- `fxhash`: `fxhash::FxHashMap<u64, u64>` (an alias of the standard map with
  `BuildHasherDefault<FxHasher>`), `default()`.
- `foldhash`: `HashMap<u64, u64, foldhash::fast::RandomState>`, `default()`.
- `fnv`: `fnv::FnvHashMap<u64, u64>`, `default()`.
- `nohash-hasher`: `nohash_hasher::IntMap<u64, u64>`, `default()`.
- `seahash`: `HashMap<u64, u64, BuildHasherDefault<seahash::SeaHasher>>`,
  `default()`.
- `siphasher`: `HashMap<u64, u64, BuildHasherDefault<siphasher::sip::SipHasher13>>`,
  `default()` (SipHash-1-3, the algorithm of the standard default hasher, with
  zero keys instead of random ones).

Each adapter inserts with `insert`, looks up with `get` and removes with
`remove(..).is_some()`, and returns the five numbers.

## Left out

- The standard library's own `RandomState` (SipHash-1-3 with random keys):
  there is no way yet to list a Rust standard-library entry. `siphasher`'s
  `SipHasher13` runs the same algorithm.
- `twox-hash` and `xxhash-rust`: both ship a `BuildHasher`, but they belong
  to the proposed `non-cryptographic-hashing/xxh64-buffers` task, where hashing
  bytes is their job.
- `hashbrown`, `indexmap` and the other map crates: they are different maps,
  compared in `insert-lookup-remove` and `count-and-retract`.
- Go's `map`, Python's `dict`, Ruby's `Hash` and JavaScript's `Map`: each is
  its own map with its own fixed hash, so it would not isolate a hasher; the
  sibling tasks compare them on integer keys. Only Rust lets a program choose
  the hasher of the standard map.
- String keys: `nohash-hasher` hashes integers only, so a string-key form
  would leave it out.
