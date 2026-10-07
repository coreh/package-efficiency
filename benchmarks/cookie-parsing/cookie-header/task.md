# Cookie request header parsing

One operation parses a `Cookie` request header string (`a=1; b=2; ...`) into a
map from cookie name to value. The 40 inputs have 1 to 12 pairs each, with
session ids, base64url tokens, numbers, flags, dotted and dashed names, empty
values and long values. Names are unique within a header and values use only
characters that every parser treats alike: no quotes, no percent escapes, no
commas, no `=` inside a value. Pairs are separated by `"; "`.

Percent-escaped and double-quoted values are left out because the included
parsers, with default settings, legitimately disagree on both, so no fixture
of either form can have one exact expected value:

- Percent escapes (`a=caf%C3%A9`): npm `cookie` decodes the value (`café`);
  Python `http.cookies`, Go `http.ParseCookie` and Rust `Cookie::split_parse`
  return it as written (`caf%C3%A9`).
- Double quotes (`a="quoted"`): Python and Go strip the quotes (`quoted`);
  npm `cookie` and the Rust crate's `value()` keep them (`"quoted"`).

The decoding and unquoting paths of these parsers are therefore not exercised,
and the figures say nothing about them.

A correct result maps every name to its exact value string. Packages differ in
what they return (a null-prototype object, an iterator of cookie structs, a
cookie container); each adapter builds the same plain map inside the measured
call, in every language. Map key order is not compared.

Only the `Cookie` request header is covered. `Set-Cookie` attributes,
serialization, signed or encrypted jars and cookie jars are outside the task.
`tough-cookie` is left out because it parses `Set-Cookie` strings, not request
headers. Packages run with their default settings as installed.
See [shared methodology](../../README.md) for timing and reproduction.
