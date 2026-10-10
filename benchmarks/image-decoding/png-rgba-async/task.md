# PNG to RGBA pixels, awaited

The asynchronous form of [png-rgba](../png-rgba/task.md): the same 38 files
and the same exact check, through packages that decode PNG only through
promises.

One operation takes a PNG file held in memory, decodes it, awaits the decode
and returns an image: width, height and a buffer of `width * height * 4`
bytes, red, green, blue and alpha for each pixel, row by row. Fixtures are
shared as JSON, so each file is a lowercase hex string; every adapter turns it
into bytes once per fixture, in `prepare`, before any measured work.

The 38 files are those of png-rgba, drawn by the same deterministic generator:
8-bit RGBA truecolor, not interlaced, from 1 by 1 up to 512 by 128 pixels
(most between 10,000 and 120,000 pixels). Nine kinds of content (gradients,
flat blocks, checkerboards, rings, smooth waves with fine noise, full-range
noise, alpha ramps, sprites with transparent backgrounds, banded rows) are
written with every PNG row filter (none, sub, up, average, Paeth, and a
row-by-row mix) and with deflate levels 1, 6 and 9. The scenario writes the
generator out again rather than importing it, because a scenario is loaded
alone beside each adapter; the two must be kept the same. It compresses with
the runtime's own zlib, so the bytes of a file can differ between Node, Bun
and Deno while the pixels are the same.

## What counts as correct

PNG is lossless, so the check is exact, as in png-rgba: the width and height
must be right and the pixel buffer must equal, byte for byte, the pixels the
generator drew, straight (not premultiplied) alpha included, and the colour of
a fully transparent pixel kept as stored. The buffer may be a `Uint8Array`, a
`Buffer` or a `Uint8ClampedArray`, whichever the library's image object
holds; the adapter returns `{ width, height, data }` read from that object
inside the call, and nothing is copied for the harness.

The scenario asserts at load that the check accepts the generator's pixels in
a `Buffer` and in a `Uint8ClampedArray`, and refuses red and blue swapped, the
rows upside down, alpha dropped (made 255), colours premultiplied by alpha,
the row filters left undone, another fixture's pixels, the input file's
bytes, a buffer of the right size never filled, base64 text in place of
bytes, and width and height swapped.

## What is measured, and what is not

This is an asynchronous task with one operation at a time
(`load.concurrency` is 1): the runner awaits each operation before it starts
the next. The decoder and the image object are made inside the measured call;
only turning the hex text into bytes is outside it.

- **Threads.** `load.threads` is 1: every adapter's own code runs on the one
  JavaScript thread. sharp decodes with libvips on a thread of libuv's pool
  (libvips may start threads of its own), and `@img/png` inflates through the
  runtime's `DecompressionStream`, whose work a runtime may do off the
  JavaScript thread. CPU is that of the whole process, every thread
  included, so that work is counted; it is not multiplied by anything.
  ImageScript and `@cross/image` decode on the JavaScript thread, inside
  promises.
- **sharp's cache is turned off.** libvips keeps a cache of recent operations
  by their arguments; with the same prepared bytes on every call, a decode
  could be answered from it and not done. The sharp adapter calls
  `sharp.cache(false)` and `sharp.concurrency(1)` when it loads, as in
  png-thumbnail-async.
- Memory is that after the rounds, above the warm baseline, as in every task.
- No timer or sleep is involved anywhere.

## Packages

Each runs with its default options.

- `@img/png` (JSR): `await decodePNG(bytes)`; width, height and the RGBA
  bytes from the image it resolves to. Pure TypeScript, inflating with the
  runtime's `DecompressionStream`.
- `sharp`: `await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true })`;
  width and height from `info`, the bytes from `data`. `ensureAlpha()` does
  nothing to these files, which all have alpha; it makes the request for four
  channels explicit. libvips (with libspng) behind N-API, installed as a
  prebuilt binary. `sharp.cache(false)` and `sharp.concurrency(1)` once, at
  load, as above.
- `@matmen/imagescript` (JSR): `await Image.decode(bytes)`; `width`, `height`
  and `bitmap` (a `Uint8ClampedArray` of RGBA) of the `Image`.
- `@cross/image` (JSR): `await Image.decode(bytes)`; `width`, `height` and
  `data` (RGBA bytes) of the `Image`. Pure TypeScript.

## Left out

- Standard libraries: no JavaScript runtime's standard library decodes PNG.
  Go's `image/png` decodes in a blocking call and is measured in png-rgba;
  Python and Ruby ship no PNG decoder. So there is no builtin entry.
- The Rust `png` crate and Go `image/png`: their calls block, and they are
  measured in png-rgba.
- `@napi-rs/image`, `image-js` and `pngjs` decode PNG too, but each has a
  synchronous decoder; an awaited wrapper around a synchronous call would add
  only a promise of ours.
- `jimp` decodes only through promises (`Jimp.fromBuffer`) and would fit;
  it was not in the set of packages this task was written for, and can be
  added as a further adapter.
- Other colour types, 16-bit depth, palettes and interlacing, as in png-rgba:
  libraries return them in different native layouts, and expanding them to
  RGBA would be adapter work.

See [shared methodology](../../README.md) for timing and reproduction.
