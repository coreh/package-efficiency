# Integers in a range

One operation takes `{ seed, count, min, max }`: a seed (an integer from 0 to
2^32 - 1), a number of draws (1024, 2048 or 4096) and an inclusive range of
integers. It creates a new pseudo-random number generator from the seed and
returns a list of `count` integers, each drawn uniformly from `min` to `max`
inclusive, using the library's own bounded-integer function. Creating the generator is part of the measured call; with
at least 1024 draws per call it is a small part. This differs from the
`seeded-u32` task, which draws raw full-width integers: here the cost is mostly
the bounded-sampling routine, over spans from 6 values to about 2^31.

The bounded-integer functions are not the same algorithm. Most reject or
widen-and-multiply so that every value in the range is equally likely.
`@std/random`'s `randomIntegerBetween` does not: it takes one float from the
generator, scales it into the range (`min * (1 - x) + max * x`) and floors it,
which is cheaper and is not free of bias on wide ranges. The entries also
differ in generator: ChaCha12 (`rand`'s `StdRng`) and ChaCha8 (`rand_chacha`)
are cryptographic generators and cost more per draw than the wyrand, xorshift,
xoroshiro, PCG and Mersenne Twister generators the other entries use. The
ranking is of each library's documented way to get seeded integers in a range,
not of one algorithm implemented several times.

There are 40 cases: 36 combinations of 12 ranges (dice 1..6, digits 0..9,
1..100, -50..50, bytes 0..255, 0..999, 1..1000, 0..65535, -32768..32767,
0..1,000,000, 1..1,000,000,007, 0..2,147,483,646) with different seeds
(including 0, 1 and 4294967295), and four repeats of earlier cases.

Different libraries use different algorithms, so their sequences are not the
same and are not compared with a reference. A correct output is accepted when:

- it has exactly `count` entries, each an integer from `min` to `max`;
- the same input gives exactly the same list (the four repeated cases);
- different seeds give different lists;
- the values fall into eight equal slices of the range in the expected
  proportions (wide tolerance, so any sound generator passes; a constant,
  a copy of the input or a skewed result does not);
- for ranges of 100 values or fewer, both endpoints occur, and for ranges of 10
  values or fewer, every value occurs.

Where a library works with floats or signed values, the adapter uses the
library's integer-range function and nothing else. Every package runs with its
default settings as installed, and uses the generator its documentation shows
for seeding (for Rust crates that is the crate's default or named generator).
Generators differ in quality and speed on purpose.

The result is the list the library fills, consumed by its length. Nothing is
cached between calls.
