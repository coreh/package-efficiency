# Shortest round-trip f64 formatting

One operation converts one finite 64-bit float to a decimal string. The 20,000 inputs
are finite, non-integral doubles (or integral ones of 1e21 and above, so every
language's JSON reader sees a float): prices, coordinates, sensor readings,
results of `sin`, `sqrt`, `exp` and division with full 17-digit mantissas, tiny
and huge magnitudes, subnormals and the largest double. NaN, infinities and
negative zero are outside the task. The harness hands fixtures to Rust as JSON, and the JSON reader there does not guarantee correctly rounded parsing of 17-digit numbers, so the inputs were chosen so that every language reads exactly the same double; this is checked, because a misread input fails verification.

A correct output is a string that reads back to exactly the input double and has
as few significant decimal digits as any string that does (the count JavaScript's
`Number#toString` produces). Verification reads each output's sign, digits and
exponent: it must parse back to the same double and have the same number of
significant digits as the reference, so a fixed-precision or over-long result
fails. Differences in spelling are accepted as equivalent because the value is
the same: `1e21`, `1E21`, `1e+21` and `1.0e21`; `5` vs `5.0`; positional versus
exponent notation. Where several strings of the minimal length read back to the
input, any is accepted. Normalization happens only in the
verifier, never in the timed call.

Packages run with their default settings as installed. Each adapter returns what
its library produces: the standard-library calls allocate and return a fresh
string, and the Rust crates format into a stack buffer, which the adapter returns
with the written length, with no heap copy. The task reuses no buffer or result,
and the 20,000 distinct inputs are more than a runtime's own cache of recently
formatted numbers holds. The timed call reads only the length. For the check,
before timing, the Rust text is taken from the buffer (`lexical-core`) or
formatted again from the same input (`ryu` and `zmij`, whose buffer type does not
expose its bytes). So the Rust figures do not include a heap allocation that the
other languages' strings do; that is what each library does when asked for the
text. Inputs are preconstructed.

Standard-library adapters: JavaScript `String(x)`, Python `repr(x)`, Ruby
`Float#to_s`, Go `strconv.FormatFloat(x, 'g', -1, 64)`.

Rust entries: `ryu`, `zmij` and `lexical-core`. The `dtoa` crate is left out:
for some inputs it returns a correct but longer string (for example
`0.000009119094960000001` for `0.00000911909496`), so it does not do the
shortest-form job this task checks. No npm or JSR package
in this category's brief offers this operation.
