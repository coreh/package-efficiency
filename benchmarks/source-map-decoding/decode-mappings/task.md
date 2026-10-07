# Source map mapping decoding

One operation takes a parsed version 3 source map (`version`, `file`, `sources`,
`names`, `mappings`) and returns every mapping in it, in generated order, as a
list of `{ generatedLine, generatedColumn, source, originalLine, originalColumn, name }`.
Lines are 1-based and columns 0-based, as in the `source-map` API. A mapping
with no name has `name: null`.

The 42 cases are deterministic maps of 3 to about 620 generated lines, with
1 to 20 sources, 0 to 80 names, empty lines, backward jumps in original line
and column, source switches, and segments with and without a name. The
`mappings` strings are produced by an independent VLQ encoder in the scenario,
and each expected list comes from the absolute positions that encoder was given.
The result must match exactly.

Packages that decode lazily or return a different shape are mapped to the
common shape inside the call, for every package alike:

- `source-map-js`: `new SourceMapConsumer(map).eachMapping(...)`, collecting the
  mapping objects the library hands out.
- `@jridgewell/trace-mapping`: `eachMapping(new TraceMap(map), ...)`, collecting
  its mapping objects.
- `@jridgewell/sourcemap-codec`: `decode(map.mappings)` returns numeric
  segments by line; the adapter turns them into the common shape by looking up
  sources and names. That conversion is timed.

The checker projects each mapping to its six fields outside timing, so a
library's own object type is accepted. Packages run with default options as
installed. A new consumer is built for every call and nothing is cached.

Scope: maps without `sourceRoot`, index maps and segments with a single field
(generated position only) are excluded, as libraries differ on them. Looking up
original positions, generating maps and remapping are other jobs. The `source-map`
package (0.7 and later) is left out: its consumer is created asynchronously
with WebAssembly, which does not fit a synchronous call.
