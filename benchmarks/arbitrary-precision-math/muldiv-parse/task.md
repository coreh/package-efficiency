# Parse, multiply and divide big integers

One operation takes a pair of positive integers a and b as base-10 strings
(a JSON array of two strings) and returns an array of three base-10 strings:
a * b, the integer quotient floor(a / b), and the remainder a mod b. Both
operands are parsed from their strings inside the timed call, with the package's
own parser, and every result is converted back to a string with the package's
own formatter.

The 40 cases are generated deterministically (no randomness at run time) with
operands from 12 to 1,800 digits. b is always smaller than a, so quotients
range from tiny to hundreds of digits; a few cases have b of 1 or a multiple of
a power of ten. This is a different job from the factorial task: it exercises
parsing, large-by-large multiplication, long division and formatting rather than
repeated small multiplications.

A correct output is the exact decimal digits, with no sign, exponent,
separators or fractional part, compared with an independent BigInt oracle.
Exact string equality is required, so a product-only or quotient-only
implementation, or one that returns its input, fails.

Packages run with their default settings as installed, with one exception:
decimal.js rounds to 20 significant digits by default, so its adapter raises the
precision to 5,000 digits on a private clone of the class. That entry is tagged
as using non-default options; it has no default-precision counterpart because
at 20 digits it would return wrong products. bignumber.js uses integer division
(idiv) and mod, which are exact regardless of its default decimal places.

Quotient and remainder come from one division wherever the package has such a
call: `QuoRem` in Go, `divmod` in Python, Ruby and bn.js, `Integer::div_rem` in
the three Rust entries. JavaScript's BigInt, bignumber.js and decimal.js have no
combined call, so those entries divide twice (`/` and `%`, `idiv` and `mod`,
`divToInt` and `mod`).

The Rust crate `num` is a facade that re-exports `num-bigint`, so the `num` and
`num-bigint` entries run the same code and should rank together.

Left out: fraction.js (a rational number type with no integer-division/mod on
big integers that matches this job), the JSR package `@quentinadam/decimal`
(a decimal type with no integer division: the quotient would have to be built
from a mod, a subtraction and a division, three steps where the integer types
do one), and Rust bigdecimal and rust_decimal (decimal types whose division is
precision-limited, with no exact integer quotient to build the job from).
