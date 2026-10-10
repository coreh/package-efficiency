# 4x4 transform chain

One operation takes a chain of 64 transforms, each a 4 by 4 matrix of 64-bit
floats, multiplies them in order (`m[0] * m[1] * ... * m[63]`) and inverts
the product. It returns both: `[product, inverse]`. This is the matrix work
of a scene graph or a camera rig, done at the one size that 3D graphics and
game libraries are built for.

An input is `{ matrices }`: 64 arrays of 16 numbers, each matrix in row-major
order. The 16 cases are chains built deterministically from a seed: every
eighth matrix is a scale (each axis 0.8, 1 or 1.25), and the others are
rotations about the x, y or z axis (two in three) or translations (one in
three, offsets multiples of a quarter from -2 to 2). Rotation cosines and
sines come from Pythagorean triples (3-4-5, 5-12-13, ... 28-45-53), so each
is a correctly rounded quotient and the fixtures are the same numbers on every
runtime. Products are well conditioned (their largest element is about 13,
their inverse's about 19), and every product is an affine transform, so its
last row is `0 0 0 1`.

Fixed-size libraries are expected to be far ahead of general ones here: a
4 by 4 type lives on the stack, its product is unrolled (often with SIMD), and
its inverse is a closed cofactor formula, where a dynamic matrix allocates,
loops and pivots. That difference is the point of the task; the sibling tasks
`square-matmul` and `matrix-inverse` cover sizes the fixed-size types cannot
take.

## What counts as correct

Each of the 32 output elements must be within 1e-9 of the scenario's own
reference, relative to the largest element of that matrix (so an element that
is zero is not held to a relative error of its rounding noise). The reference
multiplies left to right with a triple loop and inverts with Gauss-Jordan
elimination with partial pivoting. The verifier also checks that the product
times the inverse is the identity within 1e-9.

The limit is measured. Other correct methods differ from the reference by at
most 1.3e-15 (right-to-left or pairwise association, the cofactor inverse,
NumPy's `multi_dot`, `matmul` and LAPACK inverse, Ruby's `Matrix`), and the
same work in 32-bit floats differs by 1.1e-7 or more, so a library that
silently computes in `f32` fails. Floating-point association is a matter of
style here: a library may multiply the chain in any grouping, but not in any
order, since rotations do not commute.

When the scenario loads it checks that those other correct methods pass, and
proves that the check refuses wrong outputs: the chain multiplied in reverse
order, the product and inverse transposed (column-major order read as
row-major), the inverse alone transposed, the product as its own inverse, the
identity as the inverse, the first matrix only, a chain missing its last
matrix, the result rounded to 32-bit floats, another fixture's result, the
product without the inverse, and one flat array of 32 numbers.

## How the adapters work

Fixtures are shared as JSON. Every adapter defines `prepare`, which builds
the library's 64 matrices from the JSON numbers once per fixture, before any
timing; the measured call is given those matrices, multiplies them in order
with the library's product operation, inverts the product with its inverse
operation, and returns the two matrices in the library's own type. Building a
matrix from JSON would otherwise cost about as much as multiplying it in the
fixed-size libraries, and the job is the arithmetic. The prepared matrices are
shared by every call and are not changed. Nothing else is cached between
calls; default features and settings as installed.

Results stay in the library's type; the measured call reads only something
cheap, and `describe` turns the pair into two flat row-major arrays of 16
numbers once per fixture, before measuring. Libraries whose storage is
column-major (`glam`, `nalgebra`) transpose there, or build their matrices
from the row-major input with a row-major constructor in `prepare`.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `cargo/glam` | `DMat4::from_cols_array(&m).transpose()` in `prepare` (the input is row-major); the chain folded with `*`; `DMat4::inverse()`. A fixed 4 by 4 type with a cofactor inverse; `describe` reads `transpose().to_cols_array()`. |
| `cargo/nalgebra` | `Matrix4::<f64>::from_row_slice` in `prepare`; the chain folded with `*`; `try_inverse()` (nalgebra's 4 by 4 inverse is a closed formula). A fixed-size stack matrix, not the `DMatrix` of the sibling tasks. |
| `pypi/numpy` | `np.array(...).reshape(64, 4, 4)` in `prepare`; `np.linalg.multi_dot` over the 64 matrices (or `functools.reduce(np.matmul, ...)`); `np.linalg.inv`. `describe` flattens with `ravel().tolist()`. |
| `rubygems/matrix` | `Matrix.rows(rows, false)` for each matrix in `prepare`; `reduce(:*)`; `Matrix#inverse`. `describe` flattens with `to_a.flatten`. |

The package entries are written separately; this list says what each is to
call.

## Left out

- No standard library of Node, Bun, Deno, Python, Ruby, Go or Rust multiplies
  or inverts matrices. `DOMMatrix`, the browser's 4 by 4 transform type, is not
  defined in Node, Bun or Deno, so there is no built-in entry.
- No npm or JSR package is in the cluster for this task.
