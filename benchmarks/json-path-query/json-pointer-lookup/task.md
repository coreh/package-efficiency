# Resolve RFC 6901 JSON Pointers

One operation takes a parsed JSON document and a list of 60 JSON Pointers
(RFC 6901) as text, resolves each pointer against the document and returns the
list of values in the same order. A pointer to nothing gives `null` (None, nil)
in its place.

## Inputs

6 fixtures: 3 documents (an order record with 6, 16 and 40 line items, each
with nested objects, arrays, non-ASCII strings, numbers, booleans and `null`,
and an object of awkward keys) times 2 lists of 60 pointers. Each list has:

- 11 pointers every list shares: the whole document (`""`), the escapes
  (`/odd/a~1b` for the key `a/b`, `/odd/m~0n` for `m~n`, and `/odd/~01` for
  the key `~1`, which a library that decodes `~0` before `~1` reads as `/`),
  the empty key (`/odd/`, `/odd//x`, `/odd//y/2`), a key that is one space,
  keys that are digits on an object (`/odd/0`, `/odd/10`), and a mixed key
  (`/odd/k l~1m~0n/1/deep`);
- 9 pointers to nothing: a missing member at the end (`/meta/missing`) and in
  the middle (`/nope/deeper/still`), an index one past the end of an array and
  further past it with a member after it, a missing member of an item and of
  its `dims`, and escaped names that are not there (`/odd/a~1c`, `/odd/~0~1`,
  `/odd//z`);
- 40 existing pointers spread across the document (objects, arrays and
  scalars, at depths 1 to 4), including keys with `%`, `\`, `"` and non-ASCII
  letters.

The pointers are shuffled with a fixed generator so the kinds are mixed. The
expected values come from a short RFC 6901 resolver in `scenario.mjs`, not
from a package.

Not used, because packages differ and RFC 6901 does not make them the point:
array indexes with leading zeros and the `-` index (an error in some packages,
a miss or a lookup in others), pointers that step into a string or a number
(`/meta/name/0` gives a character in the JavaScript packages and a substring search in `hana`), keys that contain
`^` (`hana` also reads `^/` and `^^` as escapes, a legacy syntax of its own),
pointers that end in two empty tokens (`hana` splits `/odd//` into one empty
token), and the names `__proto__` and `constructor` (refused or skipped by the
JavaScript packages).

## Correct output

A list of 60 values, each deeply equal to the reference's value for that
pointer, in order; `null` exactly where the pointer selects nothing or selects
a `null` in the document (an item's `note`). Nothing else is accepted: no
`false` or empty object for a miss, no shorter list. The scenario proves at
load that the check refuses a list of nulls, a reversed list, another
fixture's list, and the answers of a resolver that decodes `~0` before `~1`,
that does not decode at all, or that reads `/odd/` as `/odd`.

## What is measured

Each call parses every pointer and resolves it against the document, with the
package's default options. The document is already parsed (reading JSON is not
the task). Where a package compiles a pointer into an object first
(`rfc6902`, `hana`, both Go packages), both steps are in the call, as every
package is given the pointers as text. Values are returned as the package
returns them (references into the document where it gives references). Where a
package reports a pointer to nothing as an error or an exception
(`fast-json-patch` throws for a missing member in the middle, the Go packages
return an error) or as `undefined`, the adapter maps it to `null` inside the
call; that costs those packages the error path for 9 of 60 pointers, which is
their normal way to say "not found".

## Packages

- npm: `fast-json-patch` (`getValueByPointer(document, pointer)`), `rfc6902`
  (`Pointer.fromJSON(pointer).get(document)`).
- Rust: `serde_json` (`Value::pointer(pointer)`).
- PyPI: `jsonpointer` (`resolve_pointer(document, pointer, None)`).
- RubyGems: `hana` (`Hana::Pointer.new(pointer).eval(document)`).
- Go: `go-openapi/jsonpointer` (`jsonpointer.New(pointer)` then `.Get(document)`),
  `xeipuuv/gojsonpointer` (`gojsonpointer.NewJsonPointer(pointer)` then
  `.Get(document)`).

Left out: the standard libraries of JavaScript, Python, Ruby and Go resolve no
JSON Pointer (Ruby's `dig` and Python's indexing take keys, not a pointer, so
the pointer would have to be parsed by hand), so there are no built-in
adapters. `@steady/json-pointer` (JSR) is not in the categorized package set.
JSONPath and JMESPath are other query languages
([evaluate-queries](../evaluate-queries/task.md) has JSONPath).
See [shared methodology](../../README.md) for timing and reproduction.
