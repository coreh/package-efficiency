# Lossless WebP to RGBA pixels

One operation takes a lossless WebP file held in memory, decodes it and
returns width, height and a buffer of pixel bytes, row by row: red, green,
blue and alpha for each pixel of a file with transparency; red, green and blue
for an opaque file (or four bytes with alpha 255, where that is what the
library returns). Fixtures are shared as JSON, so each file is a lowercase hex
string; every adapter turns it into bytes once per fixture, before any
measured work.

The 48 files are written by the scenario itself, with no library, after RFC
9649: the simple format (`RIFF`, `WEBP`, one `VP8L` chunk), the header's
alpha hint set only where some pixel is not opaque. Every prefix code is a
canonical code built from the symbol counts (no longer than 15 bits), stored
as a simple code where one or two symbols below 256 are used and otherwise as
a normal code, its lengths run-length coded with codes 16, 17 and 18 and, in a
third of the files, cut short with `max_symbol`. The pixels are coded in eight
ways, in turn:

- no transform, no colour cache, no backward reference, one group of codes;
- subtract-green and LZ77;
- the predictor transform (the best of the 14 predictors in each 16 by 16
  tile), LZ77 and a colour cache of 1,024 entries;
- subtract-green, predictor and cross-colour transforms, LZ77 and a cache, as
  libwebp's encoder writes a photograph;
- subtract-green, the predictor with the 14 predictors in turn tile by tile
  (so every one is used), and three groups of prefix codes chosen by a meta
  prefix image;
- predictor in 4 by 4 tiles, cross-colour, four groups of codes;
- subtract-green, cross-colour, two groups in 4 by 4 tiles, a cache of 2,048
  entries (the largest);
- subtract-green, the 14 predictors in turn, cross-colour, a cache of 2.

Backward references are found by the scenario's own matcher (up to 4,096
pixels, across rows) and written with the two-dimensional distance codes
where one fits, the plain distance otherwise. The pictures are the nine of
`tiff-rgba` (gradients, flat blocks, a checkerboard, rings, waves with fine
noise, full-range noise, an alpha ramp, a sprite on a transparent background,
banded rows with uneven alpha) at sizes from 64 by 64 to 512 by 128 (100 by
300 and 131 by 77 among them). Eight more files use the colour-indexing
transform, on pictures of 2, 3, 4, 12 and about 120 colours, so the indices
are bundled 8, 4 and 2 to a pixel or stored one to a pixel, at widths that do
not divide evenly (131, 199); one of them adds the predictor after the palette,
on the indices, as recent libwebp does. Four small files (1 by 1 and 17 by 9,
opaque and not) cover images smaller than a tile. Files run from 30 bytes to
150 KB.

## What counts as correct

The decoding is lossless, so the check is exact: the width and height must be
right and the pixel buffer must equal, byte for byte, the pixels the scenario
drew, including the colour of fully transparent pixels (a lossless decoder
keeps it; nothing in the format allows it to be dropped). A file with
transparency must give four bytes per pixel. An opaque file may give three
(Pillow and `image-webp` follow the header's alpha hint), or four with every
alpha 255. Returning the input, a constant, or a buffer of the right size
without decoding fails. The scenario asserts at load that the check refuses a
decoder that swapped red and blue (OpenCV's BGRA order), put the rows upside
down, dropped the alpha channel, premultiplied the colours by alpha, did not
add the green back to red and blue, or undid no transform at all.

Before the task was written every file was decoded by libwebp 1.6 (`dwebp`),
Pillow 12.3.0 and `golang.org/x/image` 0.45.0's `webp.Decode`, and all three
gave the drawn pixels exactly.

Each library returns what it naturally returns (a Rust `Vec<u8>`, a Go
`*image.NRGBA`, a NumPy array, a Pillow `Image`); the adapter reads width,
height and the pixel bytes from it inside the call, and nothing is serialized,
hashed or copied for the harness. An adapter does not convert an RGB result to
RGBA: where the library gives three samples, the adapter returns three. Where
a library decodes to its own colour order (OpenCV's BGR and BGRA), the
conversion to RGB or RGBA is part of the call, and the adapter's notes say
which conversion it uses. Converting to JSON (base64 pixel data) for the
verifier happens once per fixture, outside measured work. Packages run with
their default settings, as installed.

## Packages

- Rust: `image-webp` (`WebPDecoder::new(Cursor::new(bytes))`, `dimensions()`
  and `has_alpha()`, then `read_image` into a buffer of
  `output_buffer_size()` bytes: RGB or RGBA as the header says).
- Rust: `image` (`load_from_memory_with_format(bytes, ImageFormat::WebP)`,
  then the bytes of the `DynamicImage`, RGB or RGBA as decoded). `image`
  decodes WebP through the `image-webp` crate, so this entry measures that
  decoder behind the `image` API.
- PyPI: `pillow` (`Image.open(BytesIO(bytes))`, then `load()`, which forces
  the decode that `open` defers; mode `RGB` or `RGBA`, with no `convert`).
  Pillow decodes with libwebp.
- PyPI: `opencv-python-headless`
  (`cv2.imdecode(np.frombuffer(bytes, np.uint8), cv2.IMREAD_UNCHANGED)`, BGR
  or BGRA, then `cv2.cvtColor` to RGB or RGBA inside the call). OpenCV bundles
  libwebp; `IMREAD_COLOR_RGB`, which spares the conversion for JPEG, drops the
  alpha channel.
- Go: `golang.org/x/image` (`webp.Decode`, then the `Pix` buffer of the
  `*image.NRGBA` it returns for every lossless file).

## Left out

- Lossy (VP8) WebP, and lossy files with a lossless alpha plane (`ALPH`):
  the format leaves the decoder's inverse transform and upsampling open, so
  decoders differ by a level or so and no exact check exists. The job is the
  lossless format.
- The extended format (`VP8X`), animation, ICC and metadata chunks: they add
  container parsing and frame compositing, not decoding, and not every entry
  reads them the same way (an animated file is a sequence of frames).
- Standard libraries: none of Python, Ruby, Go, Rust or JavaScript ships a
  WebP decoder (Go's is in `golang.org/x/image`, a module), so there is no
  builtin entry.
- JavaScript: no package in the lists decodes WebP synchronously; `sharp`,
  `@jsquash/webp` and the other npm decoders that only decode asynchronously
  belong to an asynchronous task.

The scenario draws the pictures in floating point on each runtime, as
`tiff-rgba` does, and encodes them with integer arithmetic only; the Rust, Go
and Python entries read the files Node wrote.

See [shared methodology](../../README.md) for timing and reproduction.
