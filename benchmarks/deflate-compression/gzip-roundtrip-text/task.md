# Gzip and gunzip text

One operation takes a string, compresses it with deflate at the library's
default level, decompresses the result and returns the restored text. The 40
cases are 0 to 9,000 characters: prose, JSON records, log lines, CSV, source
code, HTML, Unicode text, base64 and hex data, long repeats and a few tiny
strings. The fixtures are text so they can be shared as JSON by every language;
they are encoded to UTF-8 bytes inside the call where a library works on bytes,
and decoded again afterwards.

A correct output is exactly the input text. The compressed bytes are not
compared: implementations and levels differ, and only the round trip is
comparable.

Because a round trip alone would also accept a function that returns its input,
the check also looks at the compressed size where the harness has a place to
report it outside timing. JavaScript adapters attach
`operation.compressedBytes(input)`, and the Rust, Python and Ruby adapters'
`describe` returns `{ text, compressedBytes }`; both repeat the adapter's
compression call once per fixture, before any measured work. For every fixture
above 300 UTF-8 bytes, except the random base64 and hex ones (a codec without
entropy coding cannot shrink those), the compressed size must be smaller than
the input (27 of the 40 fixtures). Limits: the size comes from a second,
untimed call written next to the timed one, not from the timed call itself, so
it shows that the library call compresses, and review is still what ties it to
the timed code; and the Go adapter (`compress/gzip`) returns only the text, because a
Go adapter has no untimed hook, so it gets the round-trip check alone. What is
timed is unchanged: the measured call returns the restored text only.

Framing: gzip wherever the package offers it. A package with no gzip layer
(`miniz_oxide`) uses zlib framing, which is the same deflate stream with a
shorter header and an Adler-32 instead of a CRC-32 trailer; this is accepted as
equivalent. Packages run with their default settings as installed (default
level, no dictionary, no streaming API chosen, no threads). The default
level is 6 for every entry but one: `node:zlib`, pako, fflate, flate2, Go
`compress/gzip` and Ruby `Zlib` default to 6, and `miniz_oxide` is passed 6
explicitly because its function requires a level. Python's `gzip.compress`
defaults to level 9, so the Python rows do more compression work per call than
the others. The cost of the default is what is measured. Zopfli, fdeflate and similar specialised encoders
are left out: they compress only, or are not the plain case.

See [shared methodology](../../README.md) for timing and reproduction.
