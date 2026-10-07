# RGB channels to HSL

One operation takes a color as an array of three integers (red, green, blue, each
0-255) and returns its hue, saturation and lightness. No string is parsed: this is
the numeric color space conversion the packages in the category offer, the opposite
direction of the `rgb-triples` task, and it ranks packages by their conversion
arithmetic and the objects they allocate instead of their string parsers.

The 60 inputs are primaries, secondaries, grays, black and white, near-grays, and
a deterministic spread of saturated, pastel and dark colors across the hue circle.

A correct output is `[h, s, l]` with hue in degrees (0-360) and saturation and
lightness on a 0-100 scale. Libraries differ in shape and scale, so each adapter
maps its library's result to that common triple inside the measured call, in every
language alike: `color-convert` already returns it (rounded to integers), d3-color
returns an `Hsl` object with saturation and lightness as 0-1 fractions that the adapter
scales by 100, and csscolorparser returns 0-1 fractions in an array that the adapter
scales by 100. The check compares with an independent reference conversion:
saturation and lightness may differ by 1 (some libraries round to integers, others
keep fractions), hue may differ by 1 degree around the circle (359 and 0 are
neighbours). For achromatic colors (equal channels) hue is undefined and is not
compared (libraries return 0 or NaN); saturation must be 0 (or NaN, which d3-color returns for black and white, where 0/0 is undefined). Chromatic colors need finite values.

During measurement the loop reads the lightness from each result. One call is
expected to cost tens of nanoseconds, so the loop shared by every entry and, in JavaScript, the
result array each call allocates are a large share of the figures; the Rust entry
returns its three numbers on the stack.

Three other packages in this category have no adapter in this task:
`@csstools/color-helpers` and `@omega/color` do export an RGB to HSL conversion
and could be added; `@asamuzakjp/css-color` was not examined.

Packages run with their default settings as installed. Nothing is cached between
calls. The standard libraries of JavaScript, Python, Ruby and Go have no color space
conversion, so there are no built-in entries. See [shared methodology](../../README.md).
