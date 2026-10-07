# PNG to RGBA pixels

One operation takes a PNG file held in memory, decodes it and returns an image:
width, height and a buffer of `width * height * 4` bytes, red, green, blue and
alpha for each pixel, row by row. Fixtures are shared as JSON, so each file is a
lowercase hex string; every adapter turns it into bytes once per fixture, before
any measured work.

The 38 files are built by the scenario from a deterministic generator: 8-bit RGBA
truecolor, not interlaced, from 1 by 1 up to 512 by 128 pixels (most between 10,000
and 120,000 pixels). Nine kinds of content (gradients, flat blocks, checkerboards,
rings, smooth waves with fine noise, full-range noise, alpha ramps, sprites with
transparent backgrounds, banded rows) are written with every PNG row filter
(none, sub, up, average, Paeth, and a row-by-row mix) and with deflate levels 1, 6 and 9.

A correct output has the right width and height and a pixel buffer equal, byte
for byte, to the pixels the generator drew. Returning the input, a constant or a
buffer of the right size without decoding fails that check. Each library returns
what it naturally returns (Rust a `Vec<u8>` filled by the decoder, Go an
`*image.NRGBA`); the adapter reads width, height and the pixel bytes from it
inside the call, and nothing is serialized, hashed or copied for the harness.
Converting to JSON (base64 pixel data) for the verifier happens once per fixture,
outside measured work. Packages run with their default settings, as installed.

The defaults differ in one check: Go verifies the Adler-32 checksum of the
compressed pixel data, a pass over every decompressed byte, and the `png` crate
skips it unless asked. Both verify each chunk's CRC. Only two entries are
compared, one crate and one standard library.

## Packages

- Rust: `png` (`Decoder` then `Reader::next_frame` into a buffer sized by `output_buffer_size`).
- Standard library: Go `image/png` `Decode`, using the `Pix` buffer of the resulting `*image.NRGBA`.

## Not covered

- `@img/png` (JSR) is the only PNG package in the brief's JavaScript lists. Its `decodePNG` is
  asynchronous (it uses `DecompressionStream`), so it cannot be a synchronous operation.
- Python and Ruby ship no PNG decoder. The Rust crates `gif`, `zune-jpeg`, `jpeg-decoder`,
  `tiff` and `image-webp` decode other formats and cannot do this job.
- Other colour types, 16-bit depth, palettes and interlacing: libraries return them in
  different native layouts, and expanding them to RGBA would be adapter work.
