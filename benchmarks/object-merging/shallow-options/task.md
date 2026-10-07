# Shallow option merge

One operation takes a list of three to five source objects and returns one new
object holding the top-level properties of all of them, later sources winning.
This is the common `Object.assign`-style job: nested values are NOT merged, a
later source's nested object replaces an earlier one's whole. The 40 cases are
built deterministically; each source has 12 to 40 top-level properties
(strings, numbers, booleans, `null`, and small nested objects that each carry
a key only their own source has), with heavy key overlap between sources, falsy values (`false`, `0`, `''`, `null`)
overriding earlier values, and non-ASCII keys and strings.

Scope: plain objects without `undefined` values, arrays, Dates, class
instances, getters, symbols or the `__proto__` key, because shallow-copy
libraries differ on those. Each expected result comes from a plain reference
loop in the scenario and is compared strictly, so an adapter that returns its
first or last source, a constant, or a deep merge fails: in every case nested
objects from different sources meet under the same key, and the scenario checks
that merging them would give a different result. Nested values may be
shared by reference with the sources (that is what a shallow merge does). The
check also requires that no source is modified, so adapters merge into a fresh
`{}` or use a library that returns a new object. Key order is not part of the
contract.

Packages run with their default settings as installed. `extend` is called
without its leading `true`, its documented shallow form. Libraries that merge
only two objects at a time, or that mutate their first argument by design
(`utils-merge`, `merge-descriptors`), and `defaults` (which only fills missing
values, a different job) are left out. Standard-library adapters are included
for JavaScript, Python, Ruby and Go. No crate in the brief covers this job. See
[shared methodology](../../README.md) for timing and reproduction.
