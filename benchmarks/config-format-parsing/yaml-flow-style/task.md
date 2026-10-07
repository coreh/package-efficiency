# Flow-style YAML documents

One operation parses a YAML document held in memory as a string and returns
the parsed data. Only YAML parsers take part. The documents are written in
flow style: `{key: value}` mappings and `[a, b]` sequences, the way generated
exports, Helm values and Ansible variables are often written. This exercises
a different path in a YAML parser than the block-style documents of
[yaml-documents](../yaml-documents/task.md).

## Inputs

48 documents of about 1.4 to 3.6 kilobytes. Thirty-six describe a warehouse
(location, contacts, limits, empty collections, and 4 to 9 inventory items,
each a record with about a dozen fields including nested mappings and
sequences); every fourth is a top-level list of 8 to 12 item records. Each is
written from plain data by a small emitter in `scenario.mjs`, so the expected
value is that data and not another parser's reading of the text. The layout
varies:

- the whole document as a single flow mapping, either on one line or broken
  over several lines (members one per line, nested collections on one line past
  the second level), with `#` comments after some members;
- a block mapping or block sequence whose values are flow collections: one
  `key: {...}` per line, or `- {...}` rows of a table, again on one line or
  broken over several lines;
- plain, single-quoted (with `''` for apostrophes) and double-quoted strings
  with escapes, non-ASCII text, and strings containing `,`, `[`, `]`, `{`, `}`
  and `: `, which are always quoted;
- integers, decimal fractions, booleans, `null` and `~`, empty `[]` and `{}`;
- comment lines and a leading `---` on some documents.

## The subset, and why

YAML 1.1 and 1.2 parsers disagree about what some unquoted text means, and
this task compares speed, not dialects. A string is left unquoted only if it
starts with a letter, `_` or `/`, uses only letters, digits, spaces and
`_ / . @ + = -`, and is not `null`, `true`, `false`, `yes`, `no`, `on`, `off`,
`y` or `n` in any letter case. Everything else is quoted: numbers written as
text, dates, phone numbers, versions. Numbers are decimal integers and
fractions: no exponents, octal, hexadecimal or leading zeros. No anchors,
aliases, merge keys, tags, multiple documents, block scalars or trailing
commas.

## Correct output

A value deeply equal to the source data: same keys, strings, booleans, `null`
and numbers (key order is not compared). In JavaScript it must be made of
plain objects and arrays; a Map, a document node or a syntax tree is rejected.
Returning the text, or any constant, fails.

Rust crates return their own tree (`serde_yaml::Value`; `Vec<Yaml>` from
`yaml-rust`). The harness converts it to JSON for the same check once per
fixture, before any measured work. The measured call is the parse, a read of
the top-level length, and dropping the result.

Packages run with default settings. This is parsing only: no serialization,
no schema validation, no document or syntax-tree API. See
[shared methodology](../../README.md) for timing and reproduction.

## Packages

- npm: `js-yaml` `load`, `yaml` `parse`, `confbox` `parseYAML`.
- JSR: `@std/yaml` `parse`, `@eemeli/yaml` `parse`.
- Rust: `serde_yaml` into `serde_yaml::Value`, `yaml-rust` `YamlLoader::load_from_str`.

`unsafe-libyaml` is a low-level C transpilation without a value-returning
parse; using it would mean writing the document builder in the adapter, so it
is left out. The JSON5, JSONC and `ron` parsers cannot read YAML.
