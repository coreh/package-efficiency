# Base64 to bytes

One operation takes a string of standard RFC 4648 base64 (alphabet with `+` and
`/`, `=` padding, no line breaks) and returns the bytes it encodes. This is the
decoding counterpart of the existing encoding task. Binary data decodes
differently from text: the output is raw bytes, not a string, and every input is
valid, so no error path is measured.

The 59 cases are the encodings of deterministic pseudo-random binary payloads:
20 values of 32 bytes (tokens and digests), 11 tiny payloads of 0 to 10 bytes
(every padding shape, and empty), 10 of 100 to 900 bytes, 10 of 1 to 2 KB and
8 of 2 to 4 KB, about 45 KB in all. No fixture is more than a tenth of the
bytes, but the 18 payloads of 1 KB and more are 87% of them and the 31 of 32
bytes or fewer under 2%: the figure is a mix of per-call cost on short values
and throughput on buffers of a few kilobytes, not bulk decoding of large files.

The result must be a byte array, byte for byte equal to the payload the input
was made from. The payloads are random, so returning the input, a constant or a
text decoding fails. Each language returns its library's natural byte type:
`Uint8Array` (a Node `Buffer` is one), Python `bytes`, a Ruby binary `String`,
Go `[]byte`, Rust `Vec<u8>`. A package that returns an `ArrayBuffer` is wrapped
in a `Uint8Array` view inside the call, which copies nothing. Converting a
result to a list for the verifier happens outside timed work in the native
runners. Node's `Buffer.from(text, 'base64')` is lenient about bad input; that
does not matter here because every input is valid.

Packages run with default settings as installed, with no cached results between
calls.
