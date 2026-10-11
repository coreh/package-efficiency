# Factorial as a decimal string

One operation takes a non-negative integer n (a JSON number, 0 to 1,000) and
returns n! as a base-10 string, computed by multiplying 1 by 2, 3, ... n in a
loop with the package's own number type, then converting the result to a string.
The 40 cases cover 0 and 1, small values, and a spread up to 1,000 (2,568 digits).

A correct output is the exact decimal digits, with no sign, no exponent, no
separators and no fractional part. Outputs are compared with an independent
BigInt oracle. Exact string equality is required, with no accepted spelling
differences: an integer printed as "120.0" or in exponential form is wrong.

Packages run with their default settings, with two exceptions. decimal.js
rounds to 20 significant digits by default, which cannot represent these
results, so its adapter raises the precision to 3,000 digits on a private clone
of the class. mpmath has a second entry, `mpmath-high-precision`, that sets
`mp.dps` to 3,000; at its default 15 digits it rounds and fails. Decimal and
rational packages (decimal.js, bignumber.js, fraction.js, Rust bigdecimal and
others) are measured doing integer work. Nothing is cached between
calls and the multiplication loop is inside the timed call in every language.
