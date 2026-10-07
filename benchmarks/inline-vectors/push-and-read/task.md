# Build and read many small vectors

One operation builds between 64 and 512 short vectors, one after another. Each
gets 1 to 8 integers pushed one at a time into a vector type that stores up to
8 elements inline, then every element is read back and the vector is dropped.
The result is the number of elements pushed and their sum, which must equal the
values computed independently in `scenario.mjs`.

The integers come from a small generator (seed and count are the fixture) that
every adapter repeats identically, so no measured time goes to reading input.
The vector is passed through `black_box` before it is read, so the pushes
cannot be optimized away.

Packages run with their default settings as installed. Every vector fits the
inline capacity of 8, so no package spills to the heap, and fixed-capacity types
(`arrayvec`, `heapless`) are used within their limits. What happens on overflow,
where these types differ most, is outside the task.

## Rust entries

- `smallvec`: `SmallVec<[i32; 8]>`, `push`.
- `tinyvec`: `TinyVec<[i32; 8]>`, `push`.
- `arrayvec`: `ArrayVec<i32, 8>`, `push`.
- `heapless`: `heapless::Vec<i32, 8>`, `push` (unwrapped).

Only Rust has packages in this category; there is no JavaScript or
other-language entry, since heap-only arrays are out of scope. There is no
standard `Vec` row to compare against, because the project has no way yet to
list a Rust standard-library entry.
