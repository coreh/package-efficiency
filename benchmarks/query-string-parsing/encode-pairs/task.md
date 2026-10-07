# Encoding key-value pairs

One operation takes a map of text keys to text values and returns one query string in
`application/x-www-form-urlencoded` style: `key=value` pairs joined by `&`, with keys and values
percent-encoded as UTF-8.

The 47 cases hold from 1 to 30 pairs each. Keys are unique, plain names (letters, digits, `_`, `-`,
a few accented or CJK names). Values are non-empty text with accented letters, CJK, emoji, spaces
and the reserved characters `& = + % # / ? [ ]`.  Inputs arrive as parsed JSON objects, in every language.

A correct output is ASCII only, has no raw spaces, and decodes (split on `&`, split each part on the
first `=`, `+` as space, then percent-decoding) to exactly the input map. The check ignores pair order
(Rust's JSON objects are sorted, Go's maps are unordered). A package that returns its input, a constant
or something unescaped fails, because the decoded pairs must match.

Accepted differences: the spelling of a space (`+` or `%20`), upper or lower case hex digits, whether the
characters `! ' ( ) * ~` are left raw or escaped, and pair order. Packages whose API takes lists
(Go `url.Values`) build them from the map inside the timed call, in every language alike; the others
take the map as is. Packages run with their default settings as installed.

Not covered: the empty map (serde_qs encodes it as `=`), repeated keys, arrays, nested keys, empty values, and decoding strings back to maps (see
`form-pairs`).

See [shared methodology](../../README.md) for timing and reproduction.
