# JSON with comments and trailing commas

One operation parses a configuration document held in memory as a string and
returns the parsed data. Only JSONC and JSON5 parsers take part.

## Inputs

48 documents of about 1 to 5 kilobytes, in the style of a `tsconfig.json` or
an editor settings file. Forty-two describe a service (server, database,
logging, environment, feature flags, limits, a route table); every eighth is a
top-level array of task definitions. Each is written from plain data by a
small emitter in `scenario.mjs`, so the expected value is that data and not
another parser's reading of the text. Across the set:

- `//` comments on their own line and after a value, `/* */` comments on one
  line, over several lines, and between a key and its value;
- a comma after the last member of multi-line objects and arrays (in three
  documents out of four);
- indentation with two spaces, four spaces or tabs; short arrays on one line;
- strings with escapes and non-ASCII text, and strings that look like syntax
  (`"not // a comment"`, `"/* still a string */"`, `"*/"`, a string ending in
  a backslash), which a comment scanner has to leave alone; comments that
  contain quotes and `//`;
- integers, decimal fractions, booleans, `null`, empty objects, arrays and
  strings.

## The subset, and why

JSONC is JSON plus comments and, in most tools, trailing commas. JSON5 allows
those and much more. The documents use only what both accept, so every package
does the same work on the same text: keys and strings are double-quoted, and
there are no unquoted keys, single-quoted strings, hexadecimal numbers, leading
or trailing decimal points, `Infinity`, `NaN` or multi-line strings, all of
which a JSONC parser rejects. Every string and number is written as
`JSON.stringify` writes it.

## Correct output

A value deeply equal to the source data: same keys, strings, booleans, `null`
and numbers (key order is not compared). In JavaScript it must be made of
plain objects and arrays; a syntax tree or other class is rejected.

The Rust `json5` crate deserializes into `serde_json::Value`, which is handed
to the verifier once per fixture, before any measured work. The measured call
is the parse, a read of the top-level length, and dropping the result.

## Settings

Every package is measured with its default settings. Two JSONC parsers put
trailing commas behind an option, so each also has a tuned entry with the
option on, marked as using non-default options:

- `jsonc-parser`: by default it returns the right value, but by error recovery,
  counting each trailing comma as a syntax error. The tuned entry,
  `jsonc-parser-trailing-commas`, passes `{ allowTrailingComma: true }`.
- `confbox` `parseJSONC`: by default it throws on a trailing comma, so the
  default entry cannot read these documents and is recorded as not passing.
  The tuned entry, `confbox-trailing-commas`, passes
  `{ allowTrailingComma: true }`.

`confbox` also has a JSON5 entry point, `parseJSON5`, which reads these
documents with no option. It is measured as a third entry, `confbox-json5`.

This is parsing only: no serialization, no editing, no syntax-tree or visitor
API. See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- npm: `json5` `parse`, `jsonc-parser` `parse`, `confbox` `parseJSONC` and `parseJSON5`.
- JSR: `@std/jsonc` `parse`.
- Rust: `json5` `from_str` into `serde_json::Value`.

No JSONC or JSON5 parser from the earlier combined task was left
out. The YAML parsers that shared that task are compared on YAML in
[yaml-documents](../yaml-documents/task.md).
