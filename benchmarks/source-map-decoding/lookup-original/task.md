# Original position lookup

One operation takes `{ map, queries }`: `map` is the index (0 to 3) of one of four
large version 3 source maps (400 to 2500 generated lines, 8 to 24 sources, 20 to 120
names), and `queries` is a list of 40 to 200 generated positions `[line, column]`
(line 1-based, column 0-based). It returns one result per query, in order:
`{ source, line, column, name }` of the mapping that applies, or all `null`
when none does.

"Applies" means the segment on the same generated line with the greatest column
less than or equal to the queried column (the default "greatest lower bound"
search). Queries before the first segment of a line, on empty lines and past the
last line give nulls.

The 40 cases spread over the four maps with varied query sets. The maps are
built in `scenario.mjs` with an independent VLQ encoder, and the expected answers
are computed from the absolute segments that encoder was given, not by any package.
The result must match exactly, including nulls, so an adapter that returns a
constant or the query unchanged fails.

Each adapter creates its consumer for each of the four maps once, at module load,
as a real tool loads a map once and then answers many lookups. Decoding the map is
therefore not measured here (the `decode-mappings` task measures it). The measured
call is only the lookups. Adapters cannot import the scenario, so each rebuilds the same four maps with a copy of the generator at load time.

Packages return their own result objects (`source-map-js` and
`@jridgewell/trace-mapping` objects differ in extra fields); the checker projects
them to the four fields outside timing. Packages run with default options as
installed, no caching of answers between calls.

Left out: `@jridgewell/sourcemap-codec` only decodes, so a lookup would be written
by the adapter around it. `source-map` 0.7+ creates its consumer asynchronously
with WebAssembly. `@jridgewell/remapping` and `@cspotcode/source-map-support` do
other jobs (chaining maps, patching stack traces).
