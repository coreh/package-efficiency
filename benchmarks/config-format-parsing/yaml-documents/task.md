# YAML configuration documents

One operation parses a YAML document held in memory as a string and returns
the parsed data. Only YAML parsers take part, and the documents are the
block-style YAML people write by hand, not JSON passed through a YAML parser.

## Inputs

48 documents of about 1 to 4 kilobytes. Forty-two describe a service (server,
TLS, database, logging, environment, health check, feature flags, limits, a
route table); every eighth is a top-level sequence of scheduled jobs. Each is
written from plain data by a small emitter in `scenario.mjs`, so the expected
value is that data and not another parser's reading of the text. The style
varies from one document to the next. Across the set:

- nested block mappings, block sequences, sequences of mappings, both with the
  sequence indented under its key and at the key's own indentation;
- short flow sequences (`[a, b]`), rows of numbers in flow style inside a block
  sequence, empty `[]` and `{}`;
- plain, single-quoted and double-quoted strings, the last with `\n`, `\t`,
  `\"` and `\\` escapes, and non-ASCII text;
- literal block scalars (`|` and `|-`) for scripts and certificates, some with
  blank and indented lines, and folded block scalars (`>-`) for one-paragraph
  descriptions;
- integers, decimal fractions, `true` and `false`;
- null written as `null`, as `~`, and as a key with no value;
- quoted keys (`'404'`), comment lines, comments after values, blank lines,
  and a leading `---` on some documents.

## The subset, and why

YAML 1.1 and YAML 1.2 parsers disagree about what some unquoted text means,
and this task compares speed, not dialects. So the documents stay inside what
every included parser reads the same way:

- A string is left unquoted only if it starts with a letter, `_` or `/`, uses
  only letters, digits, spaces and `_ / . @ + = - :` (a colon never before a
  space or at the end), and is not `null`, `true`, `false`, `yes`, `no`, `on`,
  `off`, `y` or `n` in any letter case. Everything else is quoted: `'8080'`,
  `'0755'`, `'1e3'`, `'2026-10-06'`, `'12:30:45'`, `'yes'`, `'~'`, version
  numbers, IP addresses, and text containing `#`, `: `, `*`, `&`, `!`, `%`,
  brackets or braces.
- Numbers are decimal integers and fractions such as `-2.5`: no exponents,
  octal, hexadecimal, underscores, infinities or leading zeros.
- No anchors, aliases, merge keys, tags, timestamps, directives, multiple
  documents, complex keys or flow mappings with content. Block scalars use
  only `|`, `|-` and `>-`, with no indentation indicator, no tabs and no
  trailing spaces.

## Correct output

A value deeply equal to the source data: same keys, strings, booleans, `null`
and numbers (key order is not compared). In JavaScript it must be made of
plain objects and arrays; a Map, a document node or a syntax tree is rejected.

Rust crates return their own tree (`serde_yaml::Value`; `Vec<Yaml>` from
`yaml-rust`). The harness converts it to JSON for the same check once per
fixture, before any measured work. The measured call is the parse, a read of
the top-level length, and dropping the result.

Packages run with default settings. This is parsing only: no serialization,
no schema validation, no document or syntax-tree API.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- npm: `js-yaml` `load`, `yaml` `parse`, `confbox` `parseYAML`.
- JSR: `@std/yaml` `parse`, `@eemeli/yaml` `parse`.
- Rust: `serde_yaml` into `serde_yaml::Value`, `yaml-rust` `YamlLoader::load_from_str`.

No YAML parser from the earlier combined task was left out: all seven read
every document identically. The JSON5 and JSONC parsers that shared that task
(`json5`, `jsonc-parser`, `@std/jsonc`, the Rust `json5` crate) cannot read
YAML and are compared in [json-dialects](../json-dialects/task.md). `confbox`
is in both because it ships a parser for each format.
