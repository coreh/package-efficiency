# TIFF to RGBA pixels

One operation takes a TIFF file held in memory, decodes its first image and
returns width, height and a buffer of pixel bytes, row by row: red, green,
blue and alpha for each pixel of an RGBA file; red, green and blue for an RGB
file (or four bytes with alpha 255, where that is what the library returns).
Fixtures are shared as JSON, so each file is a lowercase hex string; every
adapter turns it into bytes once per fixture, before any measured work.

The 44 files are written by the scenario itself, with no library: baseline
TIFF 6.0, 8 bits per sample, chunky (`PlanarConfiguration` 1), in strips. A
third are RGB (three samples), the rest RGBA (four, with `ExtraSamples` 2,
unassociated alpha, so the colour values are stored as drawn). The pixels are
stored in five ways, in turn: uncompressed, LZW, LZW with the horizontal
predictor (`Predictor` 2), Deflate (compression 8, a zlib stream) and Deflate
with the predictor. The LZW coder is the scenario's own (TIFF 6.0 section 13:
codes most significant bit first, the width growing one code early as libtiff
writes it, a Clear code before the table fills). Strips hold 1, 8, 16 or 64
rows, or the whole image, so many files end with a short strip; one file in
four is big-endian (`MM`). The pictures are the nine of `png-rgba` (gradients,
flat blocks, a checkerboard, rings, waves with fine noise, full-range noise,
an alpha ramp, a sprite on a transparent background, banded rows) at sizes from
64 by 64 to 400 by 300 (512 by 128, 100 by 300 and 131 by 77 among them). Four
small files (1 by 1 and 17 by 9, RGB and RGBA, four rows per strip) cover a
strip longer than the image and a short last strip. Files run from 210 bytes
to 480 KB.

## What counts as correct

The decoding is lossless, so the check is exact: the width and height must be
right and the pixel buffer must equal, byte for byte, the pixels the
scenario drew. An RGBA file must give four bytes per pixel. An RGB file may
give three, or four with every alpha 255. Returning the input, a constant, or
a buffer of the right size without decoding fails. The scenario asserts at
load that the check refuses a decoder that swapped red and blue, dropped the
alpha channel, premultiplied the colours by alpha, left the predictor's
differences in place, put the rows upside down, or left the last strip empty.

Each library returns what it naturally returns (a Rust `Vec<u8>`, a Go
`*image.NRGBA` or `*image.RGBA`, a NumPy array, a Pillow `Image`, an
image-js `Image`); the adapter reads width, height and the pixel bytes from
it inside the call, and nothing is serialized, hashed or copied for the
harness. An adapter does not convert an RGB result to RGBA: where the library
gives three samples, the adapter returns three. Converting to JSON (base64
pixel data) for the verifier happens once per fixture, outside measured work.
Packages run with their default settings, as installed.

## Packages

- Rust: `tiff` (`Decoder::new(Cursor::new(bytes))`, `dimensions()`, then
  `read_image()`, whose `DecodingResult::U8` holds the samples).
- Rust: `image` (`load_from_memory_with_format(bytes, ImageFormat::Tiff)`,
  then the bytes of the `DynamicImage`, RGB or RGBA as decoded). `image`
  decodes TIFF through the `tiff` crate, so this entry measures that decoder
  behind the `image` API.
- PyPI: `tifffile` (`imread(BytesIO(bytes))`, a NumPy array of height by
  width by samples). tifffile decodes LZW only through `imagecodecs`, so the
  adapter lists it as a dependency; uncompressed strips and Deflate it reads
  with its own code and `zlib`.
- PyPI: `pillow` (`Image.open(BytesIO(bytes))`, then `load()`, which forces
  the decode that `open` defers; mode `RGB` or `RGBA`, with no `convert`).
  Pillow decodes compressed TIFF strips with libtiff.
- Go: `golang.org/x/image` (`tiff.Decode`, then the `Pix` buffer of the
  `*image.NRGBA` for an RGBA file or the `*image.RGBA`, alpha 255, for an RGB
  one).
- npm: `image-js` (`decode(bytes)`, which calls the `tiff` package, then the
  raw data of the `Image`, RGB or RGBA).

## Left out

- PackBits, CCITT, JPEG-in-TIFF and other compressions: `image-js` (its
  `tiff` package) refuses PackBits, and tifffile needs `imagecodecs` for most
  of the rest. The job keeps the compressions every entry reads: none, LZW and
  Deflate.
- Tiles, planar files, palettes, greyscale, 16-bit and float samples,
  associated alpha, orientations other than top-left: libraries return them
  in different layouts (premultiplied, planes, palette indices), and turning
  them into the same bytes would be adapter work. The job is the common one,
  an 8-bit RGB or RGBA image in strips.
- Standard libraries: none of Python, Ruby, Go, Rust or JavaScript ships a
  TIFF decoder (Go's is in `golang.org/x/image`, a module), so there is no
  builtin entry.
- `scikit-image` and `opencv-python-headless`: measured elsewhere, but they
  read TIFF through plug-ins (tifffile and libtiff), which the entries above
  already measure directly.
- `sharp`, `jimp` and other npm decoders that only decode asynchronously
  belong to an asynchronous task.

The scenario draws the pictures in floating point on each runtime, as
`png-rgba` does; the Rust, Go and Python entries read the files Node wrote.

See [shared methodology](../../README.md) for timing and reproduction.
