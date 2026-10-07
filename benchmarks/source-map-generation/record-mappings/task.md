# Record mappings and encode

One operation builds one source map: it creates a generator, adds every
mapping of the fixture through the library's call for adding a mapping, and
asks for the version 3 map with its mappings encoded (the base64 VLQ string).

A fixture is the map of a bundle: `{ file, sources, names, mappings }`, with 3
to 100 source files and 231 to 16,270 mappings, each
`[generatedLine, generatedColumn, sourceIndex, originalLine, originalColumn, nameIndex]`
(zero-based; `nameIndex` is -1 when there is no name; about a third have one).
Mappings are given in generated order, one to nine per generated line, with
some lines left empty and runs of lines from one source after another. The
adapter passes the source and the name as text, and adds one to the lines where
the library counts them from one.

## What counts as correct

The same mappings can be encoded as different maps: the `sources` and `names`
lists may be in any order (the encoded indexes follow), and `file`,
`sourceRoot` and `sourcesContent` may be present or not. So the output is not
compared as text. The verifier decodes the `mappings` string, resolves each
segment through the output's own `sources` and `names` lists, and requires
exactly the fixture's list: the same number of mappings, each with the same
generated line and column, source file name, original line and column, and name.
A dropped, merged, reordered or misnumbered mapping fails.

The result is the map as the library hands it over with the mappings encoded:
an object in the JavaScript packages (`toEncodedMap`, `toJSON`); JSON text from
the Rust crate, which encodes only when it writes the map out. The verifier
parses the text. Writing the rest of the map as JSON is then part of the Rust
figure and not of the JavaScript ones; it is small next to the encoding, and is
stated in the entry's notes.

## Packages

- `@jridgewell/gen-mapping`: `new GenMapping({ file })`, `addMapping`, `toEncodedMap`.
- `source-map`: `new SourceMapGenerator({ file })`, `addMapping`, `toJSON`.
- `source-map-js`: the same calls (a fork of `source-map` 0.6).
- `sourcemap` (Rust): `SourceMapBuilder::new`, `add`, `into_sourcemap`, `to_writer`.

Not included: `magic-string` builds a map by tracking edits to a string, not
from a list of mappings; it cannot take this input and needs a task of its own
(apply a fixed list of edits to a source text, then `generateMap`), where the
same decoded-mappings check applies.

See [shared methodology](../../README.md) for timing and reproduction.
