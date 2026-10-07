# Difference, symmetric difference and listing set bits

One operation takes two lists of bit positions (`a` and `b`) and a universe size
`size`. Each position is below `size`. There are 40 fixtures in three groups:

- 24 medium, dense ones: sizes from 512 to 65,536 bits, with 5% to 50% of bits
  set in each list (repeated positions occur). The listing step returns up to
  tens of thousands of positions, so these mostly measure iterating set bits.
- 10 large, sparse ones: sizes from 100,000 to 1,000,000 bits with 40 to 2,000
  positions. Here walking mostly empty words dominates.
- 6 edge cases: an empty `a`, an empty `b`, identical sets, disjoint sets,
  positions at the first and last bit, and a full `b`.

The operation creates two bit sets of `size` bits and sets every listed
position. It then forms the difference `a \ b` and the symmetric difference
(`a xor b`), each in a copy of `a` so `a` stays intact, and lists the positions
of the set bits of each result in ascending order, using the package's own
iterator over set bits. A correct result is two lists of integers:
`[positions(a \ b), positions(a xor b)]`, both ascending with no duplicates.

The measured call includes reading the positions from the input, creating the
sets, setting bits, both operations, building both lists and dropping
everything. Packages run with their default settings as installed.

## Rust entries

- `fixedbitset`: `FixedBitSet`, `insert`, `difference_with`, `symmetric_difference_with`, `ones()`.
- `bit-set`: `BitSet`, `insert`, `difference_with`, `symmetric_difference_with`, `iter()`.
- `bitvec`: `BitVec<usize, Lsb0>`, `set`, `&= !b` for the difference (the complement is
  built from a clone of `b`, since the crate has no in-place difference), `^=`, `iter_ones()`.

`bit-vec` is left out: it has no iterator over set bits (only over every bit as a
bool), so an adapter would implement the listing itself.
Only Rust has packages in this category.
