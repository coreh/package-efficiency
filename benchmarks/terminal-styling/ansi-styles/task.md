# ANSI color and style wrapping

One operation styles a short string with ANSI escape codes. An input is an object
`{ style, a, b, c }` of preconstructed strings. Ten styles are used, round-robin
across 62 cases:

- single: `red`, `green`, `bold`, `underline` wrap `a`;
- chained: `bold-blue` and `red-bold-underline` wrap `a` in several styles at once;
- nested: `bold-in-red`, `underline-in-green`, `red-in-bold` and `deep` wrap
  `a + inner(b) + c` in an outer style, where the inner part has another style.

Inner and outer styles never share an attribute (a color is never nested in
another color), so no library has to reopen an outer color after an inner close.
Text mixes ASCII, Unicode and emoji, with no newlines. Two cases have empty text.

A correct output is a string whose escape codes, when interpreted, give the
same sequence of text runs and styles as the reference: the right text, with
the right color, bold and underline on each part, and nothing left open at
the end. Only SGR sequences (`ESC [ ... m`) are accepted. Different spellings of
the same effect are equivalent: combined or separate codes (`1;31` or `1` then
`31`), a reset (`0`) or specific close codes (`22`, `24`, `39`), and redundant
open/close pairs around empty text. Which codes close what is not standardized
across libraries, so the check compares the rendered result and not the bytes.
Each library's native output length is consumed during measurement.

Packages run with their default settings as installed, with one exception: none
of the measured processes has a terminal, and color detection would turn styling
off, so each adapter switches colors on with the option its documentation gives
for that (`level: 1`, `createColors(true)`, `enabled = true`, `setColorEnabled(true)`,
`validateStream: false`). Color-support detection itself is not measured.

This is wrapping, not stripping, measuring or wrapping styled text. Libraries
that only expose raw code constants (such as `ansi-styles`) are left out, since
the string concatenation would be written by the adapter, not the package.

## Rust entries

Each adapter returns a fresh owned `String`, formatted with the crate's own
types. Nested styles are built in one of two ways, depending on how the crate
closes a style. `colored` formats the inner styled value into the outer text
and styles that string, as the JavaScript adapters do. `owo-colors`, `yansi`
and `nu-ansi-term` instead style three separate parts (`a`, `b`, `c`), each
carrying its full style, and join them (`format!` for the first two,
`AnsiStrings` for `nu-ansi-term`): they close with a full reset or do not
re-open an outer style, so an inner part embedded in outer text would end the
outer style early. Output is verified by the same JavaScript `verifyResults`.

See [shared methodology](../../README.md) for timing and reproduction.
