# Decimal strings to numbers

One operation takes an array of 8 to 40 decimal number strings and returns an
array of the same length holding the 64-bit floating-point value of each string,
in order. The 49 cases mix small, medium and large integers (up to 15 digits),
negative integers, short decimals, price-like decimals, long fractions (up to 15
significant digits), exponent forms (`6.02e23`, `1.5E-7`, with and without a
sign), small negatives, whole numbers written with `.0`, and a final case of
tricky values (`0.1`, `4.9e-324`, `1.7976931348623157e308`, `0`, and so on).
Integers and floats are not told apart: every string becomes a double, which
holds all of these integers exactly.

Expected values come from the JavaScript engine's correctly rounded conversion,
computed once in `scenario.mjs`. A correct output is an array of numbers equal
to them (`==`, so `-0` and `0` are not distinguished and none are used).
Anything else fails: strings returned as they came in, `NaN`, a rounded or
truncated value, a wrong length. All inputs are valid, plain decimal text with
no whitespace, no `+` sign, no hex and no separators; error handling is outside
this task.

Packages run with their default settings, as installed. Each adapter parses
the strings one at a time with the package's single-string function and
collects the results; the loop and the output array are in every adapter alike.

The same fixture strings are parsed again on every pass, as in every task. On
V8 (Node and Deno) a string of one to seven digits keeps its integer value on
the string object once it has been computed, so `Number()` on those strings
(196 of the 1,144, about 17%) is a lookup rather than a parse after the first
pass. That is the engine's own behaviour and is left on; it affects the
`Number()` row and, less, `strnum`, which calls `Number()` after its own checks.

## Why plain digit strings stop at 15 significant digits

`strnum`, by design, returns the original string instead of a number when the
value would not print back to the same digits (above roughly 15 significant
digits). No default or option turns that off, so longer plain decimals would
make it fail the task rather than measure it. Exponent forms are always
converted. The other entries are correctly rounded for longer inputs too; they
are simply not exercised here.

## Entries and omissions

- `strnum`: `toNumber(string)`. It validates the text, trims zeros and compares
  the printed value before returning, so it does more than convert. It is the
  only npm package here, and its figure is the cost of those checks on top of
  `Number()`, not of a different conversion.
- JavaScript `Number()`, Python `float()`, Ruby `Float()` and Go
  `strconv.ParseFloat(s, 64)`: standard-library baselines.
- `lexical-parse-float`: `f64::from_lexical(bytes)` with default options.
- Left out: `atoi` and `lexical-parse-integer` parse integers only and cannot
  do the floating-point strings. `minimal-lexical` is a low-level building
  block that needs the caller to split mantissa and exponent first, so the
  adapter would have to implement the job itself. `@ghoullier/number-safe-parse`
  had no JSR release old enough to pass the seven-day rule when this task was
  written.

See [shared methodology](../../README.md) for timing and reproduction.
