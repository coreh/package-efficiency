# Readable record dumps

One operation takes a value and returns a human-readable string for it, the way
a logger, assertion message or snapshot would show it. The 59 cases are service
records (ids, names, flags, decimals, tags, owners, route lists, empty
containers, non-ASCII text) at several sizes, plus a few small arrays and
primitives. Nesting never goes deeper than three container levels, because
several packages collapse deeper levels by default (inspect depth 2).

Packages do not agree on the output format (`{ a: 1 }`, `Object {"a": 1}`,
`map[a:1]`, `{"a" => 1}`), so the check does not compare text. A correct
output is a string that, for the input value:

- contains every object key, every string and every number at least as many
  times as the value does (numbers as whole tokens, so `1` does not count inside
  `12`),
- contains every boolean (`true`/`True`, case-insensitive),
- contains no truncation or collapse marker (`[Object]`, `[Array]`, `...`,
  `…`, `more item`),
- is at least as long as the compact JSON text of the value minus its
  punctuation.

Order, quoting, indentation and line breaks are accepted as equivalent, and so
are the language spellings of null. Strings avoid quotes, backslashes and line
breaks, and decimals are short (`0.25`), so no package needs to escape them
differently. Packages run with default settings as installed; the work is one
call that returns the string, and the result is consumed by its length only.
Standard-library baselines: `util.inspect` (JavaScript), `repr`
(Python), `Object#inspect` (Ruby) and `fmt.Sprintf("%v")` (Go). Rust has no crate
in this category that formats an arbitrary value (`pretty_assertions` only
prints diffs), so no Rust adapter is included.
