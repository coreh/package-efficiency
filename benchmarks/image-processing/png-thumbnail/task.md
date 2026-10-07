# PNG thumbnail

One operation takes a PNG file held in memory and a target size, decodes the
file, scales the picture down to exactly that size and encodes the result as a
PNG file, returned as bytes. Fixtures are shared as JSON, so each file is a
lowercase hex string; every adapter turns it into bytes once per fixture,
before any measured work.

The 12 files are 8-bit RGBA, opaque, not interlaced, from 256 by 256 to 800 by
600 pixels, and are reduced by a whole factor of 2 to 8 (to between 64 by 64
and 256 by 64). They are drawn by the scenario: gradients, flat blocks, rings,
smooth waves and shapes, with a faint grain of up to 8 levels either way, as a
photograph has, and no detail finer than the thumbnail can show.

## What counts as correct

No two libraries produce the same bytes, or even the same pixels: resampling
filters differ (box, triangle, cubic, Lanczos), and so do PNG encoders (row
filters, compression level, RGB or RGBA). None of that is compared. The
verifier decodes each output with its own PNG reader and checks that

- the width and height are exactly the ones asked for, and the image is opaque;
- the pixels are, on average, within 2 levels (of 255) of a reference
  thumbnail: the plain average of each block of source pixels.

Every filter that takes account of the whole area a thumbnail pixel covers
lands within 0.4 to 1.3 levels of the reference on these pictures, whichever it
is. Taking one source pixel per thumbnail pixel (nearest neighbour) leaves the
grain in and lands at 3.3 to 4.6; interpolating between only the four nearest
source pixels at 2.3 to 6.3. A cropped, shifted, flipped or channel-swapped
picture is far outside. So the limit separates a downscale from a subsample
without preferring one filter to another.

## Packages

Each runs with its default options. Where a library has no default filter and
one must be named, Lanczos3 is used: it is the default of the entry that has
one, and the three passing entries then do the same resampling.

- `@napi-rs/image`: `new Transformer(bytes).resize(width, height).pngSync()`.
  A native add-on (the Rust `image` crate behind N-API), installed as a
  prebuilt binary. Its default filter is Lanczos3.
- `@silvia-odwyer/photon-node`: `PhotonImage.new_from_byteslice(bytes)`,
  `resize(image, width, height, SamplingFilter.Lanczos3)`, `get_bytes()`, and
  `free()` on both images. The Rust `photon` library compiled to WebAssembly.
- `image` (Rust): `load_from_memory`, `resize_exact(width, height, Lanczos3)`,
  `write_to(.., ImageFormat::Png)`.
- `image-js`: `encode(decode(bytes).resize({ width, height }), { format: 'png' })`.
  Not passing: its resize interpolates between the nearest source pixels
  without averaging, and maps corner pixel to corner pixel, so its thumbnails
  are 2.3 to 6.3 levels from the reference. No setting of the package changes
  that.

The three passing entries share one resampling and PNG code base (the Rust
`image` crate), reached natively, through N-API and through WebAssembly, so
this task mostly compares those three ways of running it.

Not included: `sharp`, `jimp`, `@matmen/imagescript` and `@cross/image` decode
or encode asynchronously and wait for the asynchronous task kind; `pngjs` has
no resize. PyPI `pillow` and `opencv-python`, RubyGems `mini_magick` and
`ruby-vips`, and Go `x/image` can be added when those registries can supply
adapters; the check needs no change. JPEG input is not covered: the scenario
has no JPEG encoder to draw fixtures with.

The scenario compresses the fixtures with the runtime's own zlib, so the PNG
bytes of a fixture can differ between Node, Bun and Deno while the pixels are
the same; the Rust entry reads the files Node wrote.

See [shared methodology](../../README.md) for timing and reproduction.
