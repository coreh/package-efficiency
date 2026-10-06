# HTML text and attribute escaping

One operation escapes a string, including &, <, >, double quotes and apostrophes.
The 65 cases mix clean ASCII, HTML tags/attributes, existing entities (which must
be escaped again), Unicode, dense special characters, varied lengths and empty
text. Outputs must match an independent replacement oracle. Equivalent decimal,
hex and named entities for the five characters are normalized during validation
only; each library's native output length is consumed during measurement.

This is escaping, not sanitization or parsing. Inputs are strings; URL contexts,
unquoted attributes and script/style contents are outside the task contract.
See [shared methodology](../../README.md) for timing and reproduction.

## Rust entries

- `html-escape`: `encode_quoted_attribute(input)`, returned as the crate's `Cow`: borrowed when nothing needed escaping, like the JavaScript, Go and Python functions that return their input.
- `htmlescape`: `encode_minimal(input)`.
- `askama_escape`: `escape(input, Html).to_string()`.

All three escape the same five characters. `htmlescape` and `askama_escape`
produce an owned String on every call, because that is what their APIs return;
that allocation and rendering are timed.
No output buffer or result is cached between calls. Unicode and existing
entities are covered by the same 65 inputs as JavaScript.

The Rust runner sends each native verification output to the supervisor, which
uses this task's `verifyResults` function—the same function used to verify
JavaScript. Decimal/hex/named entity normalization runs only there, before the
supervisor permits warm-up or timing. Measured calls retain their native output
spelling. This prevents charging only Rust for spelling normalization.

CPU is single-threaded process user + system time. The existing counting
allocator's overhead is included. Rust consumes byte length and JavaScript
consumes UTF-16 length, both constant-time checksum operations. Where a crate's
API always returns an owned String, clean input is copied where JavaScript
returns the original immutable string; this cost is included and should be
considered when interpreting the comparison. All inputs are preconstructed and
parsing is excluded.

```sh
node scripts/measure.mjs html-escaping/text-attributes --runtimes=rust
node scripts/measure-rust-check.mjs --missing
node --test harness/tests/rust-html-operation.test.mjs
npm run build
```

API references: [html-escape](https://docs.rs/html-escape/latest/html_escape/fn.encode_quoted_attribute.html),
[htmlescape](https://docs.rs/htmlescape/),
[askama_escape](https://docs.rs/askama_escape/latest/askama_escape/).
