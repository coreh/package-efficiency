# Fixed-point decimal ledger arithmetic

One operation takes a ledger of 2,000 lines, given as two arrays of decimal
strings, `amounts` and `rates`, and a block size of 200. For every line it
parses the amount and the rate with the package's own parser and multiplies
them exactly; it adds the products of each block of 200 lines into a
subtotal, and the ten subtotals into a total. It returns 11 strings: the
total first, then the ten subtotals in order, each rounded half to even to
two decimal places (cents) with the package's own rounding call and written
with its own formatter. The exact subtotals are added into the total, not the
rounded ones, so rounding too early gives a wrong total.

This is the money-style job: the values are small enough for fixed-size
decimals, and the work is many parses, multiplications and additions of short
numbers, where `muldiv-parse` and `factorial-string` work on a few huge
integers. Every amount and rate is parsed inside the timed call, and nothing is
kept between calls.

## Fixtures

Six ledgers of 2,000 lines, generated deterministically (a fixed-seed
xorshift, no randomness at run time).

- An amount has up to 10 integer digits and 0 to 6 fractional digits (mostly
  2), written as generated, with trailing zeros (`120.50`, `7.000`), and
  sometimes zero (`0.00`). About one in ten is negative; in the fourth ledger
  (refunds) six in ten are, so its subtotals and total are negative.
- A rate has 0 to 4 integer digits and 0 to 6 fractional digits (`0.006712`,
  `151.37`, `1.250000`, `3`), one per line, so a rate is parsed as often as
  an amount.
- The size of an amount is chosen so that every product is below 10^12 in
  absolute value, so the exact values have at most 12 fractional digits and
  every running sum stays below 10^15: at most 27 significant digits. The
  scenario asserts this when it loads. That is narrower than amounts of up to
  18 integer digits times arbitrary rates, on purpose: it keeps every exact
  value inside the 28 digits of a 96-bit decimal (`rust_decimal`) and of
  Python's default decimal context, so no entry rounds before the final step
  and every entry is doing exact arithmetic.
- The half-cent cases are put in: in about a third of the blocks the last line
  is a fee line, an amount with six fractional digits times the rate
  `0.000001`, chosen so that the subtotal lands exactly on half a cent; in the
  ledgers with odd numbers the last line of the last block makes the total
  land on half a cent instead. The scenario asserts that there are ties that
  round down to an even cent, ties that round up to one, and negative ties.
  No value is exactly a whole number of cents and none rounds to zero.

## What counts as correct

Each of the 11 strings is read as a plain decimal (`-?digits(.digits)?`) and
its value must equal the scenario's own result, computed exactly with BigInt
in units of 10^-12 and rounded half to even. The value is compared, not the
spelling, in one respect only: trailing zeros after the decimal point may be
dropped or added (`1234.5` and `1234.500` both pass for `1234.50`). Some
packages print a value with its scale (two places after rounding) and some
drop the zeros (Ruby `BigDecimal#to_s('F')`, shopspring `String()`), and
both are the same amount. A value that is not rounded to cents has a
different value and fails. Exponent notation, a leading `+`, leading zeros,
group separators, `-0`, numbers instead of strings, and the total in another
place fail.

The scenario checks itself when it loads. These fail: rounding half away from
zero, truncating, the unrounded sums, binary floating point, rounding every
product to cents before adding, rounding every product and sum to 20
significant digits (what decimal.js does at its default precision), the
values in exponent notation, the subtotals without the total, the total last
and another fixture's result. The expected strings with trailing zeros
dropped or added pass.

## Packages

- `decimal.js` (npm): `new D(amount).times(rate)`, `plus`, then
  `toDecimalPlaces(2, D.ROUND_HALF_EVEN)`. Its default precision of 20
  significant digits would round the products (up to 27 digits), so the
  adapter raises the precision to 40 on a private clone of the class; the
  entry uses a non-default option, as in `muldiv-parse`.
- `bignumber.js` (npm): `new BigNumber(amount).times(rate)`, `plus`, then
  `decimalPlaces(2, BigNumber.ROUND_HALF_EVEN)`. Multiplication and addition
  are exact at the defaults.
- `rust_decimal` (Rust crate): `Decimal::from_str`, `*`, `+`, then
  `round_dp_with_strategy(2, RoundingStrategy::MidpointNearestEven)` and
  `to_string()`. A 96-bit decimal with up to 28 fractional digits, which holds
  every value here exactly.
- `bigdecimal` (Rust crate): `BigDecimal::from_str`, `*`, `+`, then
  `with_scale_round(2, RoundingMode::HalfEven)` and `to_string()`.
- `github.com/shopspring/decimal` (Go): `decimal.NewFromString`, `Mul`,
  `Add`, then `RoundBank(2)` and `String()`.
- `github.com/cockroachdb/apd` (Go): `apd.NewFromString`, `Context.Mul`,
  `Context.Add`, then `Context.Quantize` to exponent -2 with a context whose
  rounding is `apd.RoundHalfEven` and whose precision holds 28 digits, and
  `String()`.
- `gopkg.in/inf.v0` (Go): `new(inf.Dec).SetString`, `Mul`, `Add`, then
  `Round(z, x, 2, inf.RoundHalfEven)` and `String()`.
- `bigdecimal` (RubyGems): `BigDecimal(amount) * BigDecimal(rate)`, `+`,
  then `round(2, :banker)` and `to_s('F')`.
- Standard library: Python `decimal.Decimal` in the default context (28
  digits, half to even), `quantize(Decimal('0.01'), rounding=ROUND_HALF_EVEN)`
  and `str()`; Python `fractions.Fraction`, exact rationals (reduced to lowest
  terms after every step, which is part of its figure), written with
  `format(value, '.2f')`, which since Python 3.12 rounds a Fraction exactly,
  half to even. On PyPy, `decimal` is the pure-Python `_pydecimal`.

Every entry builds its result as strings, so formatting the 11 values is timed
in every language; it is small beside the 2,000 lines.

## Left out

- JavaScript `BigInt`, Go `math/big` and Ruby `Integer`: integer types with no
  decimal parsing or decimal rounding. Scaling, rounding and formatting would
  have to be written by hand, which a standard-library entry does not do. Go
  `big.Rat` parses decimals but has no half-even rounding to a number of
  places (`FloatString` rounds half away from zero), and `big.Float` is binary.
- Ruby `BigDecimal` has no standard-library entry: it is a gem since Ruby 3.4,
  measured as the `bigdecimal` package above.
- `@quentinadam/decimal` (JSR): exact decimal arithmetic, but its only
  rounding (`round`, and `toFixed` through it) rounds halves towards positive
  infinity; there is no half-even mode, so it would fail the tie fixtures.
- `fraction.js` (npm), and the `fraction` and `num-rational` crates: rational
  types without a documented half-even rounding to decimal places
  (`fraction.js` `round(places)` rounds halves up); Python's `Fraction` is in
  because its `format` does round half to even.
- `bn.js` (npm) and the `num`, `num-bigint` and `num-bigint-dig` crates:
  integers only.
- `mpmath` and `sympy` (PyPI): `mpmath` is binary floating point; `sympy`
  would do the job only through its `Rational`, a rational type like the ones
  above, with no decimal rounding call.

See [shared methodology](../../README.md) for timing and reproduction.
