# Lazy map, filter, take and sum

One operation takes `[data, limit]`: an array of integers and a count. It must
compute, lazily and in this order:

1. map every value `x` to `x * 3 + 1`;
2. keep the results that are not divisible by 5;
3. take the first `limit` of those;
4. reduce them to their sum, starting from 0.

The result is a single number. The 49 fixtures hold arrays of 50 to 5,000
integers (a small, a medium and a large size class, built by a fixed
linear-congruential generator, no randomness) and limits that cut the stream
short, equal the exact number of survivors, exceed it, or are 0. Expected sums
are computed by a plain loop and compared exactly, so an adapter that returns
a constant, ignores `limit`, or skips the filter fails.

Chunking is not part of the chain: only some of the packages offer it, and
the common job is map, filter, take and reduce. Each adapter builds the chain
with the package's own combinators on every call and the callbacks are module
level functions defined once. Packages that return arrays eagerly from these
steps are not used; the lazy variants are. The standard library adapters
(JavaScript iterator helpers, Python `itertools`, Ruby `Enumerator::Lazy`)
do the same job. Packages run with default settings as installed.
The `@coven/iterables` and iterator-helper adapters need a runtime that has
`Iterator.prototype.map` (Node 22 or later, Bun, Deno).
