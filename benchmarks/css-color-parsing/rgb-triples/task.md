# Color string to RGB

One operation takes a CSS color string and returns its red, green and blue
channels. The 74 inputs mix `#rgb`, `#rrggbb` (lower and upper case), comma
separated `rgb(r, g, b)` with integers or whole-number percentages, and
`hsl(h, s%, l%)` with varied hues, saturations and lightness, including grays
and the extremes. All are valid, opaque colors.

A correct output holds the three channels on the 0-255 scale. Each library
returns its own shape and the adapter returns it as is: an array whose first three
entries are the channels (an optional fourth entry is alpha and must be 1), an
object with `r`, `g`, `b` (and an optional `opacity` or `a` of 1), or, in Rust,
the crate's color type read through a description that is not timed. Channels are
rounded to the nearest integer for the check, and each may differ from an independent
reference conversion by 1, because libraries round or truncate fractional hsl
results differently. Nothing else is normalized.

Packages run with their default settings as installed. This is parsing a string
to channels; color spaces beyond sRGB, named colors, interpolation and string
output are outside the task. No results are cached between calls. The standard
libraries of JavaScript, Python, Ruby and Go have no CSS color parser, so there are
no built-in entries. See [shared methodology](../../README.md).
