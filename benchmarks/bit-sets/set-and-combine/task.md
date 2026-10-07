# Set bits, union, intersect and count

One operation takes two lists of bit positions (`a` and `b`) and a universe size
`size`. Each position is below `size`. There are 48 fixtures in two groups:

- 36 small, dense ones: sizes from 64 to 4,096 bits, lists from 0 to 4,096
  positions, with repeated positions, an empty list, a full list, sets that do
  not overlap and sets that are identical. A set is at most 64 machine words
  here, so these fixtures mostly measure setting bits.
- 12 large, sparse ones: sizes from 65,536 to 1,000,000 bits (1,024 to 15,625
  words) with lists of 2 to 512 positions, again including identical,
  overlapping and non-overlapping sets. Here creating and copying the sets, the
  union, the intersection and the counts, which all walk every word, outweigh
  setting the bits.

Every fixture is called equally often, so the 12 large fixtures account for most
of the time in a run.

The operation creates two bit sets of `size` bits, sets every listed position
in each, then forms the union and the intersection of the two sets and counts
the set bits. A correct result is four integers in this order:
`[count(a), count(b), count(a union b), count(a intersect b)]`. Repeated
positions count once.

The measured call includes reading the positions from the input, creating the
sets, setting the bits, the union, the intersection (each computed in a copy of
the first set, so the original stays intact), the counts and dropping everything.
Packages run with their default settings as installed.

## Rust entries

- `fixedbitset`: `FixedBitSet`, `insert`, `union_with`, `intersect_with`, `count_ones(..)`.
- `bit-vec`: `BitVec`, `set`, `or`, `and`, `count_ones`.
- `bit-set`: `BitSet`, `insert`, `union_with`, `intersect_with`, `len`.
- `bitvec`: `BitVec<usize, Lsb0>`, `set`, `|=`, `&=`, `count_ones`.

Every entry is given the full capacity up front and counts with the package's
own counting method.
Only Rust has packages in this category.
