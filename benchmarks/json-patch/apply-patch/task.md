# Apply an RFC 6902 patch

One operation takes a JSON document and a JSON Patch (RFC 6902), both as text,
applies the patch and returns the patched document as JSON text. A patch that
cannot be applied gives `null` (None, nil) instead.

## Inputs

36 fixtures. Each is an order record of 2 to 3 KB (nested objects, arrays of 8 to
16 line items, numbers, strings with non-ASCII text, `null`) and a patch of 14
to 24 operations that mixes `add`, `remove`, `replace`, `move`, `copy` and
`test`. Pointers use array indexes and `-`, insert into the middle of arrays,
use the `~0` and `~1` escapes and a non-ASCII key. One `copy` is followed by a
change to the copy, so a library that shares the value instead of duplicating it
changes the original too. A `test` compares an object whose keys are in another
order than the document's. Documents are written compact or indented.

Every sixth patch fails, with the failing operation last, after operations that
did change the document: a `test` that differs, a `remove` and a `replace` of a
missing member, an `add` past the end of an array, a `move` from a missing
member, and a `test` whose value has the wrong type (`"1"` for `1`). The result
for those is `null`, not the partly patched document.

The expected value of each fixture comes from a short RFC 6902 reference in
`scenario.mjs`, not from a package.

## Correct output

The text parses to a value deeply equal to the reference's (key order is not
compared; spacing is not compared), or is `null` exactly when the patch must
fail. Each adapter reads both texts, applies the patch with the package's
default options, and writes the document, so the work is the same in every
language. Where a package reports failure by returning errors (`rfc6902`) or
throwing, the adapter maps it to `null` inside the call.

## Packages

- npm: `fast-json-patch`, `rfc6902`, `immutable-json-patch`, `jsonpatch`.
- Rust: `json-patch`.
- PyPI: `jsonpatch`.
- RubyGems: `hana`, `json-patch`.
- Go: `evanphx/json-patch` (v5).

Not passing, with the reason, in each adapter's notes: `fast-json-patch` with
defaults does not check that paths exist (a variant passes `validateOperation`
and passes); `rfc6902` accepts an `add` past the end of an array;
`immutable-json-patch` compares objects in key order in `test`; `hana` and the
`json-patch` gem share a copied value.

Left out: `hashdiff` (RubyGems) and `gomodules.xyz/jsonpatch` (Go) only compute
a patch from two documents; none of the languages' standard libraries applies
JSON Patch, so there are no built-in adapters. No JSR package was found.
See [shared methodology](../../README.md) for timing and reproduction.

## The lenient task

This is the strict task of a pair. [apply-patch-lenient](../apply-patch-lenient/task.md) runs the same
adapters on the same inputs with a check that leaves out or forgives one
stated kind of difference. It has the 30 fixtures whose patch applies, and accepts a `copy` that shares its value with its source. `fast-json-patch` with defaults, `rfc6902`, `hana` and the `json-patch` gem pass there; `immutable-json-patch` does not.
See "Strict and lenient tasks" in the [shared methodology](../../README.md).
