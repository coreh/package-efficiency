# GIF to RGBA pixels

One operation takes a GIF file held in memory, decodes its single frame and
returns an image: width, height and a buffer of `width * height * 4` bytes,
red, green, blue and alpha for each pixel, row by row. Fixtures are shared as
JSON, so each file is a lowercase hex string; every adapter turns it into
bytes once per fixture, before any measured work.

The 44 files are written by the scenario itself, with no library: GIF89a, one
image that covers the whole logical screen at 0,0. The LZW coder is the
scenario's own (GIF89a appendix F: codes least significant bit first, a Clear
code first, the width growing without early change, a Clear when the table
reaches 4096 codes, the End code at the width the decoder reads it with); the
noise pictures fill the table, so the Clear in mid-stream is exercised. The
colour table is, in turn, global only, local only, or local with a global
table of the same colours in reverse order, which the local one must
override. Half the files are interlaced (the four passes of appendix E).
Tables hold 2 to 256 colours (minimum code sizes 2 to 8). Nine kinds of
picture are drawn with palette indices: an ordered-dither gradient over a
256-colour cube, flat blocks (4 colours), a checkerboard (2), rings (16),
crossing waves with fine noise (128), full-range noise (256), a sprite on a
transparent background (16, transparent index 0), line art on a transparent
background (8, transparent index the last), and banded rows with noise rows
(64). A further fifth of the other files make their centre pixel's colour
transparent. Some files carry a Graphic Control Extension without
transparency, or a Comment Extension, which the decoder must skip. Sizes run
from 64 by 64 to 512 by 128 (100 by 300 and 131 by 77 among them); four small
files (1 by 1 opaque and transparent, 17 by 9 and 3 by 5 interlaced, where
some passes hold no row) cover the edges. Files run from 35 bytes to 74 KB.
The pictures are integer arithmetic only, so Node, Bun and Deno write the
same bytes; the Rust, Go and Python entries read the files Node wrote.

## What counts as correct

GIF is lossless, so the check is exact: the width and height must be right
and the pixel buffer must equal, byte for byte, the colours the scenario's
indices select, with alpha 255, and 0,0,0,0 for a pixel of the transparent
index. The scenario sets the colour-table entry of the transparent index to
black, so that this holds whichever way a decoder writes a see-through pixel
(Go writes zero; the `gif` crate and Pillow copy the table's colour with
alpha 0). With any other colour there, the RGB of a fully transparent pixel
would differ between correct decoders, and that is not part of the job.
Returning the input, a constant, or a buffer of the right size without
decoding fails. The scenario asserts at load that the check refuses a decoder
that ignored the transparent index, used the global table where a local one
overrides it, left interlaced rows in stored order, swapped red and blue, put
the rows upside down, or returned the palette indices as grey levels.

Each library returns what it naturally returns (a Rust `Vec<u8>` or
`RgbaImage`, a Go `*image.Paletted`, a Pillow `Image`); the adapter reads
width, height and the pixel bytes from it inside the call, and nothing is
serialized, hashed or copied for the harness. Where a library decodes to
palette indices (Go, Pillow), the expansion to RGBA is part of the call, since
the task asks for RGBA pixels; the entry's notes say how. Converting to JSON
(base64 pixel data) for the verifier happens once per fixture, outside
measured work. Packages run with their default settings, as installed, apart
from the colour output the task asks for.

## Packages

- Rust: `gif` (`DecodeOptions::new()`, `set_color_output(ColorOutput::RGBA)`,
  `read_info(Cursor::new(bytes))`, then the frame's RGBA bytes, read by
  `next_frame_info()` and `read_into_buffer` into a `Vec` of
  `buffer_size()` bytes, or taken from `read_next_frame()`; width and height
  from the frame).
- Rust: `image` (`load_from_memory_with_format(bytes, ImageFormat::Gif)`,
  then `into_rgba8()`). `image` decodes GIF through the `gif` crate, so this
  entry measures that decoder behind the `image` API, with whatever it adds
  (it can compose the frame onto a canvas the size of the logical screen;
  here the two are the same size).
- PyPI: `pillow` (`Image.open(BytesIO(bytes)).convert("RGBA")`; `open` reads
  the header and `convert` forces the decode of the palette image, then
  expands it with the transparency).
- Standard library: Go `image/gif` `Decode`, then `draw.Draw` of the
  resulting `*image.Paletted` into an `*image.RGBA`, whose `Pix` buffer is
  returned. Every alpha of a GIF is 0 or 255, so the premultiplied buffer is
  the same bytes as straight RGBA.

## Left out

- Animation (several frames, disposal methods, frames smaller than the
  screen, offsets): composing frames is another job, and libraries return
  the first frame either alone or composed on a canvas. Every file here has
  one frame that covers the screen, so both readings give the same pixels.
- Pixels outside the colour table's used entries, a missing colour table, a
  truncated stream: decoders differ in what they do with a damaged file (an
  error, black, the background colour), and the job is to decode a valid one.
- `image-js` (npm) decodes PNG, JPEG, TIFF and BMP, not GIF. `sharp`, `jimp`
  and other npm decoders that only decode asynchronously belong to an
  asynchronous task.
- Python and Ruby ship no GIF decoder, so Go is the only standard-library
  entry.

See [shared methodology](../../README.md) for timing and reproduction.
