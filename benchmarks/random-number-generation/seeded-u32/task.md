# Seeded 32-bit integers

One operation takes `{ seed, count }`: a seed (an integer from 0 to 2^32 - 1) and
a number of draws (64, 128, 256 or 512). It creates a new pseudo-random number
generator from the seed and returns a list of `count` unsigned 32-bit integers
drawn from it. Creating the generator is part of the measured call.

There are 40 cases: 36 different seeds (including 0, 1 and 4294967295) and four
repeats of earlier cases.

Different libraries use different algorithms, so their sequences are not the
same and are not compared with a reference. A correct output is accepted when:

- it has exactly `count` entries, each an integer from 0 to 4294967295;
- the same seed and count give exactly the same list (the four repeated cases);
- different seeds give different lists;
- no list is constant or mostly repeated values;
- over all outputs together, the mean is close to the middle of the range and
  each of the 32 bit positions is set about half the time (wide tolerances, so
  that any sound generator passes and a broken one does not).

Where a library naturally produces signed 32-bit values (pure-rand), the adapter
reinterprets them as unsigned inside the call. Where a library produces floats
(`@std/random`), the adapter asks it for integers in the full unsigned 32-bit
range with the package's own integer function. Every package runs with its
default settings as installed, and uses the generator its documentation shows
for seeding (for Rust crates that is the crate's default or named generator).
Generators differ in quality and speed on purpose; this task measures the cost
of seeding and drawing, not of statistical quality.

The result is the list the library fills, consumed by its length. Nothing is
cached between calls.
