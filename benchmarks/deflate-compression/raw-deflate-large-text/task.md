# Raw deflate of large text

One operation takes a text buffer of about 10 KB to 250 KB, compresses it with
raw deflate (RFC 1951, no zlib or gzip header or trailer) at the library's
default level and returns the compressed bytes. There is no decompression in
the measured call: the first task in this category round-trips small strings,
so setup and per-call overhead matter there; here the cost is dominated by the
encoder's match search over a large input.

The 32 cases are generated deterministically in four size classes (roughly 10,
30, 80 and 200 KB), each across eight content kinds: prose, JSON records, log
lines, CSV, source code, HTML, Unicode text and random base64. The fixtures are
text so they can be shared as JSON by every language; libraries that work on
bytes encode to UTF-8 inside the call (a small, linear cost next to
compression), and `node:zlib`, Python and Ruby take the text directly.

A correct output is a valid raw deflate stream. The verifier, outside timing,
inflates every output with `node:zlib` and requires exactly the input bytes. It
also requires every text fixture (all kinds except random base64) to compress to
less than 80% of its size, which fails an adapter that emits stored blocks,
returns its input or a constant. The compressed bytes themselves are not
compared: levels and match finders differ between implementations. Outputs reach
the verifier as a byte array (JavaScript), a list of integers (Rust, Python,
Ruby) or base64 (Go's `[]byte` through `encoding/json`); this conversion happens
once per fixture before any measured work.

Framing is raw deflate everywhere: `deflateRaw` (pako), `deflateSync` (fflate),
`deflateRawSync` (node:zlib), `DeflateEncoder` (flate2), `compress_to_vec`
(miniz_oxide), `compressobj(wbits=-15)` (Python), `Zlib::Deflate` with negative
window bits (Ruby) and `compress/flate` (Go). Packages run with their default
settings as installed; the default level is 6 for all of them, and
`miniz_oxide` is passed 6 explicitly because its function requires a level.
Compressor state is created per call, which is how each library's one-shot API
works.

Left out: minizlib (a stream wrapper around node:zlib), async-compression (async
adapters), fdeflate (a specialised fast encoder, not the plain default case),
zopfli (a different, far slower algorithm) and zlib-rs (the adapter would need
its low-level C-style API).

See [shared methodology](../../README.md) for timing and reproduction.
