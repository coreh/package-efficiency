# HTML text and attribute escaping

One operation escapes a string: &, <, >, double quotes and apostrophes. The 65
cases mix clean ASCII, HTML tags and attributes, existing entities (which must
be escaped again), Unicode, dense special characters, varied lengths and empty
text. Outputs must match an independent replacement oracle. Equivalent decimal,
hex and named entities for the five characters are normalized during validation
only; measurement consumes each library's native output length.

This is escaping, not sanitization or parsing. URL contexts, unquoted
attributes and script/style contents are outside the task.

See [shared methodology](../../README.md) for timing and reproduction.

## Rust entries

- `html-escape`: `encode_quoted_attribute(input)`, returned as the crate's
  `Cow`: borrowed when nothing needed escaping, like the JavaScript, Go and
  Python functions that return their input.
- `htmlescape`: `encode_minimal(input)`.
- `askama_escape`: `escape(input, Html).to_string()`.

All three escape the same five characters. `htmlescape` and `askama_escape`
return an owned String on every call, because that is what their APIs return,
so clean input is copied where JavaScript returns the original string; that
allocation and rendering are timed. No output buffer or result is cached
between calls.

The Rust runner sends each output to the supervisor, which checks it with this
task's `verifyResults`, the same function used for every other language, before
warm-up or timing. Entity normalization runs only there: measured calls keep
their native spelling, so no language pays for normalization.

CPU is the process's user and system time, including the counting allocator's
overhead. Rust consumes the byte length and JavaScript the UTF-16 length, both
constant-time. All inputs are built before timing.

```sh
node scripts/measure.mjs html-escaping/text-attributes --runtimes=rust
node scripts/measure-rust-check.mjs --missing
node --test harness/tests/rust-html-operation.test.mjs
npm run build
```

API references: [html-escape](https://docs.rs/html-escape/latest/html_escape/fn.encode_quoted_attribute.html),
[htmlescape](https://docs.rs/htmlescape/),
[askama_escape](https://docs.rs/askama_escape/latest/askama_escape/).
