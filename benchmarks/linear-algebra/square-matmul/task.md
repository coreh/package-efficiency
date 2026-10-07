# Square matrix multiplication

One operation multiplies two dense square matrices of 64-bit floats and returns
the product. An input is `{ n, a, b }`: the size and the two matrices as flat
row-major arrays of `n * n` numbers. The 48 cases use sizes 4, 6, 8, 12, 16
and 24 (4 by 4 is the most common) with varied entries. Entries are multiples of
a quarter and small, so every product and sum is exact and a correct result does
not depend on summation order.

A correct output is the matrix product `a * b`, `n * n` elements in row-major
order, each within 1e-9 of a reference triple loop. Libraries return their own
matrix type; the verifier reads its flat row-major elements (for the JavaScript
package, `data`). Adapters build the library's matrix from the flat input inside
the measured call and multiply with the documented product operation, with
default settings as installed. Nothing is cached between calls.

Rust adapters read the shared JSON input inside the call, with one allocation
and one pass per operand: `ndarray` and `matrixmultiply` collect a `Vec<f64>`
that becomes (or is) the matrix storage, and `nalgebra`, whose storage is
column-major, fills its matrix from the JSON numbers with `from_row_iterator`.
Each then multiplies. The result stays in the crate's type; the
measured call reads only its length, and conversion to JSON happens once per
fixture before measuring.

The three Rust rows are not independent. Without their optional BLAS features
(not enabled here), `ndarray`'s `dot` calls `matrixmultiply::dgemm` for every
size, and `nalgebra`'s dynamic-matrix product calls it when every dimension is
above 5, so for the 6 by 6 and larger cases (30 of 48) all three rows run the
same kernel and differ mostly in the wrapper around it. For the 4 by 4 cases
`nalgebra` uses its own loop instead.

Left out: `glam` only has fixed 2 to 4 dimensional types, so it cannot take
every size. `@zarrita/zarrita` stores chunked arrays and has no multiplication.
No standard library multiplies matrices. Multi-threading is not enabled
(no `rayon` features). The brief's 1,000 by 1,000 and 10 million call sizes are
too large for the shared per-call loop.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- JSR: `@maths/matrix` `multiply`.
- crates.io: `ndarray` `dot`, `nalgebra` `DMatrix` product, `matrixmultiply` `dgemm`.
