# PNG thumbnail, awaited

The asynchronous form of [png-thumbnail](../png-thumbnail/task.md): the same
12 files and the same check, through packages that decode or encode only
through promises.

One operation takes a PNG file held in memory and a target size, decodes the
file, scales the picture down to exactly that size and encodes the result as a
PNG file, awaits all of it, and returns the file's bytes (a `Buffer` or
`Uint8Array`). Fixtures are shared as JSON, so each file is a lowercase hex
string; every adapter turns it into bytes once per fixture, in `prepare`,
before any measured work.

The 12 files are 8-bit RGBA, opaque, not interlaced, from 256 by 256 to 800 by
600 pixels, and are reduced by a whole factor of 2 to 8 (to between 64 by 64
and 256 by 64). They are drawn by the scenario: gradients, flat blocks, rings,
smooth waves and shapes, with a faint grain of up to 8 levels either way, as a
photograph has, and no detail finer than the thumbnail can show. The scenario
writes the generator out again rather than importing it, because a scenario
is loaded alone beside each adapter; the two must be kept the same.

## What counts as correct

As in png-thumbnail: no two libraries produce the same bytes, or even the same
pixels, because resampling filters and PNG encoders differ, and none of that
is compared. The verifier decodes each output with its own PNG reader (it
refuses a bad CRC, a bit depth other than 8 and interlacing) and checks that

- the width and height are exactly the ones asked for, and the image is opaque;
- the pixels are, on average, within 2 levels (of 255) of a reference
  thumbnail: the plain average of each block of source pixels.

Measured on these files: every filter that takes account of the whole area a
thumbnail pixel covers lands within 0.25 to 1.3 levels of the reference (an
exact block average, as jimp's default resize computes, is 0.25 away: the
rounding to whole levels; the Lanczos3 filter of the Rust `image` crate is 0.4
to 1.3). Taking one source pixel per thumbnail pixel lands at 3.3 to 6.6, and
so does interpolating between the nearest source pixels (bilinear or bicubic
over 4 or 16 pixels), because at a whole-number reduction those sample points
fall exactly on source pixels. The limit of 2 sits in that gap.

The scenario asserts at load that a block-averaged thumbnail passes, as bytes
in a `Buffer` or a plain `Uint8Array`, and that each of these is refused: a
nearest-neighbour thumbnail, the input file returned unchanged, another
fixture's thumbnail, red and blue swapped, a mirrored picture, an alpha of 254,
a file with a damaged byte, and base64 text in place of bytes.

## What is measured, and what is not

This is an asynchronous task with one operation at a time
(`load.concurrency` is 1): the runner awaits each operation before it starts
the next. The decoder, the image object and the encoder are all made inside
the measured call; only turning the hex text into bytes is outside it.

- **Threads.** `load.threads` is 1: every adapter's own code runs on the one
  JavaScript thread. But two packages do the work itself elsewhere: sharp runs
  libvips on a thread of libuv's pool (and libvips may start threads of its
  own), and `@napi-rs/image`'s `png()` runs as an N-API asynchronous task on a
  thread of libuv's pool. For those two the thread count is not one, even
  though one operation is in flight at a time and the JavaScript thread only
  waits. CPU is that of the whole process, every thread included, so that
  work is counted; it is not multiplied by anything. jimp, ImageScript and
  `@cross/image` do their work on the JavaScript thread, inside promises.
- **sharp's cache is turned off.** libvips keeps a cache of recent operations
  by their arguments; with the same prepared bytes on every call, a decode
  could be answered from it and not done. The sharp adapter calls
  `sharp.cache(false)` when it loads, so every operation decodes, resizes and
  encodes. It also calls `sharp.concurrency(1)`, so that libvips works on one
  thread at a time, as near to `load.threads` as the package allows.
- Memory is that after the rounds, above the warm baseline, as in every task.
- No timer or sleep is involved anywhere.

Set beside png-thumbnail, the `@napi-rs/image` figures show what the awaited
form costs over the blocking one: the same Rust code, handed to a worker
thread and back.

## Packages

Each runs with its default options; where a library has no default filter and
one must be named, Lanczos3 is used, as in png-thumbnail.

- `sharp`: `await sharp(bytes).resize(width, height).png().toBuffer()`, default
  options (the Lanczos3 kernel, `fit: 'cover'`, which with the exact aspect
  ratio crops nothing). libvips behind N-API, installed as a prebuilt binary.
  `sharp.cache(false)` and `sharp.concurrency(1)` once, at load, as above.
- `@napi-rs/image`: `await new Transformer(bytes).resize(width, height).png()`,
  default options: the Lanczos3 filter. The Rust `image` crate behind N-API,
  the same as in png-thumbnail with `pngSync()`.
- `jimp`: `const image = await Jimp.fromBuffer(bytes)`,
  `image.resize({ w: width, h: height })` with no `mode` (its default resampler
  averages the area each output pixel covers when it scales down), then
  `await image.getBuffer('image/png')`. Pure JavaScript.
- `@matmen/imagescript` (JSR): `await Image.decode(bytes)`,
  `image.resize(width, height)`, `await image.encode()`. Not passing: its only
  resize mode is `RESIZE_NEAREST_NEIGHBOR`, which takes one source pixel per
  thumbnail pixel and leaves the grain in (3.3 to 6.6 levels from the
  reference). No setting of the package averages.
- `@cross/image` (JSR): `await Image.decode(bytes)`,
  `image.resize({ width, height })` (default method `bilinear`), then
  `await image.encode('png')`. Not passing: its bilinear and bicubic resizers
  interpolate between the nearest 4 or 16 source pixels without averaging,
  and at a whole-number reduction their sample points fall on single source
  pixels, so the result is the nearest-neighbour thumbnail (3.3 to 6.6
  levels). Its third method is `nearest`. No setting of the package averages.

## Left out

- Standard libraries: no runtime's standard library decodes or encodes PNG or
  resizes a picture, so there is no builtin entry.
- `@silvia-odwyer/photon-node`, `image-js` and the Rust `image` crate: they
  decode, resize and encode synchronously and are measured in png-thumbnail;
  an awaited wrapper around the same calls would add only a promise of ours.
- PyPI `pillow`, `opencv-python` and `scikit-image`, RubyGems `rmagick` and Go
  `x/image`: their calls block, and they are measured in png-thumbnail.
- JPEG input, transparency and fractional reductions, as in png-thumbnail.

The scenario compresses the fixtures with the runtime's own zlib, so the PNG
bytes of a fixture can differ between Node, Bun and Deno while the pixels are
the same.

See [shared methodology](../../README.md) for timing and reproduction.
