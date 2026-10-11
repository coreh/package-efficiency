# Text to QR module matrix

One operation encodes a text payload at a requested error-correction level
(L, M, Q or H) and returns the QR code as a two-dimensional boolean matrix
(`true` is a dark module). The 59 inputs are URLs with tracking parameters,
map links, digit-only strings, upper-case alphanumeric tickets, Wi-Fi
credentials, vCards, mailto links, non-Latin and emoji text, sentences up to
about 490 characters, and a few one-character texts. They span versions 1 to
about 20 and all four levels.

Each result is checked by an independent QR decoder in `scenario.mjs`: it
validates finder, timing and dark-module patterns, both copies of the format
information, version information, de-interleaves the codewords, checks
Reed-Solomon syndromes of every block, decodes numeric, alphanumeric, byte and
ECI segments and requires the decoded text to equal the input exactly. A
library that returns constants, its input or an unfilled matrix fails.

Accepted differences, because they are all valid QR codes:

- Mask pattern, segment splitting and the chosen version may differ.
- A library may use a higher error-correction level than requested when the
  data still fits the same version (`@libs/qrcode` documents this); a lower
  level fails.
- The matrix may carry a light quiet zone of 0 or 2 modules on every side.
  `@libs/qrcode` always adds 2 and returns it as is, with no stripping. A
  wider quiet zone fails.

Packages run with their default settings as installed, except where an entry
says otherwise. Setup done once by the libraries themselves is not part of
this task; nothing is cached by the adapters.

## Entries

- `@libs/qrcode`: `qrcode(text, { output: 'array', ecl })`, returning `boolean[][]`.
- `@levischuck/tiny-qr`: `qrCode({ data: text, ec }).matrix`, taking the
  `matrix` property of the result object (a property read, no copy).
- `qrcode` (PyPI): `QRCode(error_correction=level).add_data(text)`, then
  `get_matrix()`. Its default border is 4 modules, which the check does not
  accept, so it is recorded as not passing; `qrcode-border-0` is the same call
  with `border=0`.
- `rqrcode` and `rqrcode_core` (RubyGems): `QRCode.new(text, level:).modules`,
  rows of booleans; `rqrcode` delegates to `rqrcode_core`.
- `boombuler/barcode` (Go): `qr.Encode(text, level, qr.Auto)`, with the image
  read into a `[][]bool` inside the call.

## Left out

- `@ghost/kjua-revived` creates DOM elements (canvas, SVG or image) and needs a
  browser; there is no synchronous in-memory matrix output on Node, Bun or Deno.
- SVG output is not compared: `@levischuck/tiny-qr` only produces the matrix
  and relies on separate packages for SVG and PNG.

See [shared methodology](../../README.md) for timing and reproduction.
