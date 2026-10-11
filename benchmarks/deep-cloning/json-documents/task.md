# Deep clone of JSON-shaped documents

One operation takes one nested value and returns an independent deep copy of it.
The 48 cases are JSON-compatible documents built deterministically: user records,
order lists with line items, configuration trees, matrices of numbers, deeply
nested chains, wide flat maps, lists of short strings, and a few tiny values
(a scalar, an empty list, an empty map). They range from one value to roughly
two thousand values, with Unicode strings, nulls, booleans, integers and floats.

A correct output is a value equal to the input in structure and content, in which
no object or array is the same object as, or shares one with, the input. The
JavaScript check asserts deep equality with the expected document, then
asserts that the root and every nested object and array is a distinct object
from the input's, and that mutating the copy leaves the input untouched. The
Python and Go checks (a JSON comparison with the expected document) can only see
equality, so they cannot tell a copy from the input itself, or from a copy that
shares nested values with it.

Scope: JSON-compatible values only. Cycles, shared sub-references, class
instances, Date, Map, Set, typed arrays, functions and prototype handling are
excluded; libraries differ on all of these, and a package is not penalised for
how it treats them.

Packages run with their default settings as installed:

- `clone` is called as `clone(value)`. It tracks visited objects (circular
  handling is on by default) and that cost is part of the measurement.
- `@ungap/structured-clone` is called as `structuredClone(value)` with no
  options. When the runtime has a native `structuredClone` and no options are
  passed, the package calls it, so on Node, Bun and Deno this adapter measures
  the native function plus a thin wrapper; it is expected to rank close to the
  built-in baseline.
- Built-in `structuredClone` (Node, Bun, Deno) and Python's `copy.deepcopy`
  are the standard-library baselines. Ruby has no deep copy in its standard
  library (`Marshal` is serialization) and Go has none, so neither is included.
  No Rust crate or JSR package in this category offers this operation.
- Go `mohae/deepcopy` (`deepcopy.Copy`) and `mitchellh/copystructure`
  (`copystructure.Copy`) are called with their defaults.
- Go `jinzhu/copier` copies into a new value of the input's type with
  `copier.Copy` and default options. That is not a deep copy: nested maps and
  slices stay shared with the input, which the Go check cannot see. The variant
  `jinzhu-copier-deep-copy` passes `Option{DeepCopy: true}`, which makes them
  independent.

No setup is needed by any package, so nothing is hoisted out of the call. See
[shared methodology](../../README.md) for timing and reproduction.
