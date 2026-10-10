# JPEG to RGB pixels

One operation takes a JPEG file held in memory, decodes it and returns an
image: width, height and a buffer of pixel bytes, red, green and blue for each
pixel, row by row (or red, green, blue and alpha, where that is what the
library returns). Fixtures are shared as JSON, so each file is a lowercase hex
string; every adapter turns it into bytes once per fixture, before any
measured work.

The 28 files are written by the scenario itself: baseline (sequential,
Huffman-coded) JFIF files with three components, the quantization tables of
ITU T.81 Annex K scaled to quality 90 as libjpeg scales them, and the example
Huffman tables of Annex K.3. Half are 4:4:4 and half 4:2:0. Six kinds of
picture (smooth colour waves with grain, a document of thin rules and dots,
a gradient under a small checkerboard, four saturated regions blended where
they meet, rings over a hue sweep, heavy grain) are drawn at sizes from 64 by
64 to 512 by 384, several of them not a multiple of 8 or 16, so the decoder
must crop the padded edge; a third of the files have restart markers, at
intervals of 1 to 7 MCUs. Four small files (1 by 1, 17 by 9, in both
samplings) cover a partial MCU.

The scenario chooses the quantized DCT coefficients of every block (a forward
transform of the picture it drew, rounded), writes them into the file, and
computes the reference picture from those same coefficients: dequantized,
inverse-transformed in floating point exactly as T.81 A.3.3 defines it, 4:2:0
chroma interpolated linearly between the nearest samples, and converted with
the JFIF YCbCr-to-RGB equations. The coefficient tables are written out, so
Node, Bun and Deno write the same bytes.

## What counts as correct

The width and height are compared exactly, and the buffer must hold three
bytes per pixel, or four with every alpha 255. The pixels are compared with the
reference within a tolerance, because the standard leaves two things to the
decoder:

- the inverse DCT: integer implementations (libjpeg's, Go's, the crates')
  round differently from the exact transform, by up to a level or so per
  sample;
- 4:2:0 chroma upsampling: libjpeg's "fancy" interpolation (3/4 and 1/4
  weights), which the reference follows, or repeating each chroma sample over
  its 2 by 2 square, as Go and `jpeg-js` do. Both are sound; the pictures have
  no chroma detail finer than a few pixels, so the two agree closely.

The verifier checks two averages of the absolute difference over the three
colour channels, in levels of 255: over the whole picture, at most 2.5, and
over the worst 8 by 8 square, at most 6 (so that one wrongly decoded block,
for instance at a restart marker, cannot hide in the average of a large
picture). Measured on these files: libjpeg-turbo (Pillow, OpenCV) 0.25 to
0.39 and 0.73 at worst for a square; Go `image/jpeg` 0.28 to 0.97 and 2.4;
`image-js` (`jpeg-js`) 0.45 to 1.06 and 2.4. Decoders that did not do the job
land far outside: red and blue swapped 10 and up (30 for a square), luma only
or chroma dropped 5.5 and up (16.5), the AC coefficients of luma skipped 8 and
up (12.5). Luma blocks transposed (coefficients read in the wrong order) fail
on every picture that is not symmetric within its blocks. The scenario asserts
at load that each of these is refused. Returning the input, a constant or a
buffer of the right size without decoding fails too.

Each library returns what it naturally returns; the adapter reads width,
height and the pixel bytes from it inside the call, and nothing is serialized,
hashed or copied for the harness. Converting to JSON (base64 pixel data) for
the verifier happens once per fixture, outside measured work. Packages run with
their default settings, as installed. Where a library decodes to its own
colour layout (YCbCr planes, BGR), the conversion to RGB is part of the call,
and the package's notes say which conversion it uses.

## Packages

- Rust: `zune-jpeg` (`JpegDecoder::new(bytes).decode()`, RGB by default).
- Rust: `jpeg-decoder` (`Decoder::new(bytes).decode()`, RGB for a
  three-component file).
- Rust: `image` (`load_from_memory_with_format(bytes, ImageFormat::Jpeg)`,
  then the RGB buffer of the `DynamicImage`). Current releases of `image`
  decode JPEG through `zune-jpeg`, so this entry measures that decoder behind
  the `image` API.
- PyPI: `pillow` (`Image.open(BytesIO(bytes)).convert("RGB")`; Pillow decodes
  with libjpeg-turbo).
- PyPI: `opencv-python-headless`
  (`cv2.imdecode(np.frombuffer(bytes, np.uint8), cv2.IMREAD_COLOR_RGB)`;
  OpenCV bundles libjpeg-turbo, and the flag returns RGB instead of its usual
  BGR).
- npm: `image-js` (`decode(bytes)`, which calls `jpeg-js` and returns RGBA).
- Standard library: Go `image/jpeg` `Decode`, then `draw.Draw` of the
  resulting `*image.YCbCr` into an `*image.RGBA`, whose `Pix` buffer is
  returned (RGBA, alpha 255). The conversion is part of the call.

## Left out

- Progressive, arithmetic-coded, 12-bit, CMYK and greyscale files: not every
  entry reads them, and libraries return greyscale and CMYK in different
  layouts. The job is the common one, a baseline colour JPEG.
- 4:2:2 and other samplings, and pictures with sharp colour edges: there the
  choice of chroma upsampling, which the standard leaves open, moves the
  result by more than any integer transform does, so the tolerance could no
  longer tell a sound decoder from a wrong one. The pictures blend their
  colour regions over 40 pixels for that reason.
- Python and Ruby ship no JPEG decoder, so Go is the only standard-library
  entry.
- `sharp`, `jimp` and other npm decoders that only decode asynchronously
  belong to an asynchronous task.

The scenario computes the fixtures and the reference in floating point on each
runtime. The values that could differ between engines (the cosines of the
transform) are written out, and the files are the same on Node, Bun and Deno;
the Rust, Go and Python entries read the files Node wrote.

See [shared methodology](../../README.md) for timing and reproduction.
