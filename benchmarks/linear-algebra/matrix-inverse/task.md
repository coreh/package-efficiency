# Square matrix inversion

One operation inverts a dense square matrix of 64-bit floats and returns the
inverse. An input is `{ n, a }`: the size and the matrix as a flat row-major
array of `n * n` numbers. The 48 cases use sizes 3, 4, 5, 6, 8, 10 and 12
(4 by 4 is the most common). The matrices are non-symmetric, diagonally
dominant and have entries that are multiples of a quarter, so they are
invertible and well conditioned. One case in three has its rows rotated, which
puts zeros on the diagonal and needs row pivoting.

Inversion costs about the cube of the size, so although a quarter of the cases
are 4 by 4, most of the time goes to the large ones: by that estimate the
8, 10 and 12 sized matrices (three cases in eight) take close to nine tenths of
it. The figure is closer to "invert a 10 by 10 matrix" than to "invert a 4 by 4".

There are only two entries, one in JavaScript and one in Rust, so the ranking
shows the language as much as the library. The sibling task `square-matmul` has
four entries.

A correct output is the inverse, `n * n` elements in row-major order. The
verifier checks every element within 1e-8 of a Gauss-Jordan reference with
partial pivoting, and also that the input times the result is the identity
within 1e-8, so returning the input or a constant fails. Libraries return their
own matrix type; the verifier reads its flat row-major elements (for the
JavaScript package, `data`). Results are not bit-identical across libraries
(`@maths/matrix` also rounds results to 15 significant digits), which the
tolerance accepts. Adapters build the library's matrix from the flat input
inside the measured call and invert with the documented operation, default
settings as installed. Nothing is cached between calls.

The Rust adapter fills a `DMatrix` from the shared JSON numbers with
`from_row_iterator` (nalgebra storage is column-major) and calls `try_inverse`.
The result stays in the crate's type; the measured call reads only its length,
and conversion to JSON happens once per fixture before measuring.

Left out: `glam` only has fixed 2 to 4 dimensional types, so it cannot take every
size. `ndarray` and `matrixmultiply` have no inverse (that lives in separate
crates). `@zarrita/zarrita` has no linear algebra. No standard library inverts
matrices.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- JSR: `@maths/matrix` `invert`.
- crates.io: `nalgebra` `DMatrix::try_inverse`.
