# Insert and remove in the middle of small vectors

One operation processes between 64 and 512 short vectors, one after another.
For each vector, 1 to 8 integers are inserted one at a time at a position
chosen by the generator (anywhere from the front to the end), so existing
elements are shifted. Then 0 to 3 elements are removed with `remove(index)` at
generated positions (never emptying the vector), and the last element is
popped when more than one remain. The remaining elements are read back in
order. The result is `[elements remaining, sum, position-weighted sum]`, where
the weighted sum adds each element times its 1-based index, so wrong ordering
fails. All values must equal those computed independently in `scenario.mjs`.

The integers and positions come from a small generator (seed and count are the
fixture) that every adapter repeats identically. Each vector is passed through
`black_box` before it is read, so the work cannot be optimized away. The
generator and its modulo arithmetic are inside the timed call and are a large
part of it next to such small vector operations, the same for all four crates,
which narrows the differences between them.

Packages run with their default settings as installed. Every vector fits the
inline capacity of 8, so nothing spills to the heap, and fixed-capacity types
are used within their limits. The difference from `push-and-read` is the
element shifting done by `insert`, `remove` and `pop`.

## Rust entries

- `smallvec`: `SmallVec<[i32; 8]>`.
- `tinyvec`: `TinyVec<[i32; 8]>`. The crate is built with its `alloc` feature,
  which is off by default and which the `TinyVec` type requires.
- `arrayvec`: `ArrayVec<i32, 8>`.
- `heapless`: `heapless::Vec<i32, 8>`; `insert` returns a result that is
  unwrapped.

Only Rust has packages in this category.
