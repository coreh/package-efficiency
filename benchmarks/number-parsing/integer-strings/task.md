# Decimal integer strings

One operation takes an array of 1,000 decimal integer strings and returns an
array of the same length holding the integer value of each string, in order.
Every string is an optional sign (`-` or `+`) followed by 1 to 15 digits, so
every value is below 10^15 in magnitude and is exact in a 64-bit double as
well as in a 64-bit integer.

The six cases are built deterministically, 6,000 strings in all:

- lengths 1 to 15 drawn evenly, a fifth negative and a few with `+`;
- short identifiers and counts, 1 to 4 digits, unsigned, with some `0`;
- 5 to 10 digits, around the 32-bit range, a tenth negative;
- 11 to 15 digits (millisecond timestamps, large ids), half negative;
- every string signed, `-` or `+`, a quarter with one to three leading zeros;
- the edges first (`0`, `+0`, `0000`, `007`, `-0042`, `+000123`, the 8-, 16-
  and 32-bit limits and one past them, `999999999999999` with each sign,
  `000000000000001`), then strings from all the mixes above in turn.

About a quarter of the strings are negative, a tenth carry `+`, and one in
twenty has leading zeros (the 15-digit limit counts them).

## What counts as correct

The scenario knows every value without parsing: it builds the number and its
text from the same digits. A correct output is an array of 1,000 integers
equal to them exactly. A JavaScript number, a Python or Ruby integer and a Go
or Rust `i64` all count, since every value is a safe integer and reaches the
check as the same JSON number. No string is `-0`, so a JavaScript `-0` against
another language's `0` never arises.

Anything else fails. When the scenario loads it proves the check refuses: the
strings returned as they came in, the values as strings, the sign ignored,
one value off by one, a 10-digit value wrapped to 32 bits, a 15-digit value
cut to its first nine digits, a signed or zero-padded string read as `0` or
`NaN`, a fraction, a missing value and another fixture's results.

All inputs are valid. There is no whitespace, no `_` separator, no hex or
octal prefix, nothing past 15 digits and nothing that overflows, so error
handling and overflow checks are outside this task. Python's `int()` and
Ruby's `Integer()` would accept underscores and Python's also white space;
none are in the fixtures.

Packages run with their default settings, as installed. Each adapter parses
the strings one at a time with the package's single-string function and
collects the results; the loop and the output array are in every adapter
alike. A Rust adapter reads each string's bytes from the fixture as it goes,
as in `decimal-strings`.

The same fixture strings are parsed again on every pass, as in every task. On
V8 (Node and Deno) a plain string of one to seven digits, with no sign or
leading zero, can keep its integer value on the string object once it has
been computed (about a third of the 6,000 strings are of that form), so
`Number.parseInt` on those strings may be a lookup rather than a parse after
the first pass. That is the engine's own behaviour and is left on.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/js-number-parseint` | `Number.parseInt(s, 10)` on each string via `Array.map`; a number. |
| `builtin/python-int` | `int(s)` for each string in a list comprehension; an `int`. |
| `builtin/ruby-integer` | `Integer(s, 10)` for each string; an `Integer`. The explicit base matters: `Integer("-0042")` without it reads the leading zero as octal and gives -34. |
| `builtin/go-strconv-parseint` | `strconv.ParseInt(s, 10, 64)` for each string into a `[]int64`; an error panics. |
| `cargo/atoi` | `atoi::atoi::<i64>(bytes)` for each string, which returns `Option<i64>`; `None` is an error. |
| `cargo/lexical-parse-integer` | `i64::from_lexical(bytes)` (`lexical_parse_integer::FromLexical`) with default options for each string; an error is returned. |

The package entries are written separately; this list says what each is to
call.

## Left out

- `lexical-parse-float` (the float sibling, measured in `decimal-strings`)
  returns a double, not an integer, and parses a broader grammar; it belongs
  to that task.
- JavaScript `Number()` would give the same values but is the float
  conversion already measured in `decimal-strings`; `Number.parseInt` is the
  integer function. Go's `strconv.Atoi` is `ParseInt(s, 10, 0)` with a fast
  path for short strings; one Go entry is kept, the function the cluster names.
- Rust's `str::parse::<i64>` is in the standard library, but there is no
  `builtin` path for Rust, so it cannot be listed.
- No npm, JSR, PyPI, RubyGems or Go module package is in the cluster.

See [shared methodology](../../README.md) for timing and reproduction.
