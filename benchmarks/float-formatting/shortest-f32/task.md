# Shortest round-trip f32 formatting

One operation converts one finite 32-bit float to a decimal string. This is the
single-precision counterpart of `shortest-f64`: a 24-bit mantissa, at most 9
significant digits, and each crate's separate f32 code path (the f64 task does not
exercise it). The 20,000 inputs are distinct, finite f32 values, about one in
twenty of them whole numbers: prices, coordinates, sensor readings, results of
`sin`, `sqrt`, `exp` and division rounded to f32, tiny and huge magnitudes,
subnormals and the largest f32. NaN, infinities and negative zero are outside the
task. The harness passes fixtures as JSON numbers (the exact double value of each
f32); Rust and Go narrow it to f32 (exact) once per fixture, before any timing.

A correct output is a string whose value rounds to exactly the input f32 and which
has as few significant decimal digits as any string that does. Verification reads
the output's digits and exponent, checks that `Math.fround(Number(output))` equals
the input, and that the digit count equals the minimum found by trying 1 to 9
digits. A result formatted as an f64 (up to 17 digits), a fixed-precision result,
or a constant fails. Spelling differences are accepted as equivalent because the
value is the same: `1e21`, `1E21`, `1e+21`, `1.0e21`; `5` vs `5.0`; positional vs
exponent notation. Where several strings of minimal length round to the input, any
is accepted. Normalization happens only in the verifier.

Packages run with their default settings as installed. Each adapter returns what
its library produces: the Rust crates format into a stack buffer, and the adapter
returns that buffer with the written length, with no heap copy; Go's `FormatFloat`
allocates and returns a string. The timed call reads only the length. For the
check, before timing, the Rust text is taken from the buffer (`lexical-core`) or
formatted again from the same input (`ryu` and `zmij`, whose buffer type does not
expose its bytes).

Entries: Rust `ryu`, `zmij` and `lexical-core`, and Go
`strconv.FormatFloat(x, 'g', -1, 32)`. `dtoa` is left out: for some inputs it returns a correct but longer f32 string (`-3.1415901` for the f32 nearest -3.14159). `lexical-write-float` is left out because it
is the engine underneath `lexical-core`. JavaScript, Python and Ruby have no f32
formatting in their standard library (they only format doubles), and no npm or JSR
package in the brief offers this operation.
