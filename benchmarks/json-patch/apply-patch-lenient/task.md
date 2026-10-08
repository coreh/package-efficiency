# Apply an RFC 6902 patch, lenient

The lenient form of [apply-patch](../apply-patch/task.md), which is the strict
task. One operation is the same: it takes a JSON document and a JSON Patch
(RFC 6902), both as text, applies the patch and returns the patched document
as JSON text. The entries are the adapters of the strict task, unchanged; this
folder has none of its own (`"adaptersFrom"` in `task.json`).

The strict task says which packages conform to RFC 6902. This one compares
the cost of applying a valid patch among all the packages that apply one
correctly, including those that the strict task turns away for the two
reasons below.

## What differs from the strict task

1. **No patch has to be rejected.** The strict task has 36 fixtures; in every
   sixth the last operation cannot be applied (a `test` that differs, a
   `remove` or `replace` of a missing member, an `add` past the end of an
   array, a `move` from a missing member, a `test` of the wrong type) and the
   result must be `null`. Those six fixtures are left out here, so there are
   30. They are removed, not forgiven in the check, because what a package
   does with such a patch is an error path: one rejects the patch, another
   skips the operation, another appends where it should refuse. That is not
   the same work, and whether it is done right is the strict task's question.
   The 30 fixtures that remain are the strict task's own, byte for byte, in
   the same order.
2. **A copy may share its value with its source.** RFC 6902 says `copy` adds
   a copy of the value. Every patch here copies `/items/0` to `/featured` and
   then replaces `/featured/qty`. A package that puts the same object in both
   places changes `/items/0/qty` as well. The check accepts that document too:
   exactly the document that a `copy` without duplication gives, computed by
   the strict task's reference with the duplication turned off. Nothing is
   removed from the patches for this, so both tasks time the same operations.

Nothing else is forgiven. In particular a `test` must still compare objects
without regard to key order, so `immutable-json-patch`, which fails such a
`test` and with it a valid patch, does not pass here either.

## Correct output

JSON text that parses to a value deeply equal to the reference's result (key
order and spacing are not compared), or to the reference's result with shared
copies. The input returned unchanged, another fixture's result, a constant,
`null`, and a document without the copied member are rejected when the
scenario loads.

## Entries that pass only here

Each has its reason in its adapter's notes, in the strict task's folder:

- `fast-json-patch` with default options: does not check that paths exist, so
  it does not reject a `remove` or `replace` of a missing member.
- `rfc6902`: accepts an `add` past the end of an array.
- `hana` and `json-patch` (RubyGems): `copy` shares the value.

See [shared methodology](../../README.md) for timing and reproduction, and
"Strict and lenient tasks" there for the rules of such a pair.
