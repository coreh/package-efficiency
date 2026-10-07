# Legacy character set decoding

One operation takes an encoding name (`Shift_JIS`, `EUC-JP`, `GBK`, `Big5`,
`KOI8-R` or `windows-1252`, the WHATWG names) and a buffer of bytes in that
encoding, and returns the decoded Unicode string. Only decoding is measured;
the existing `round-trip` task covers encoding.

The 73 cases are 12 sizes for each encoding, from a single sentence to a few
hundred (roughly 10 bytes to 20 KB, about 2 KB on average), built from
realistic Japanese, simplified and traditional Chinese, Russian and Western
European sentences mixed with ASCII runs, plus one empty buffer. The bytes
were produced by an independent encoder (CPython codecs) and are written into
the scenario as hex, together with the text they must decode to. A correct
output equals that text exactly. Returning the input, a constant, or
mis-decoded characters fails. Inputs contain only valid sequences with
characters on which all conforming decoders agree (no Shift_JIS backslash or
tilde, no undefined windows-1252 bytes, no half-width kana), so error and
replacement behaviour is not compared.

Fixtures are shared with every language as JSON, so the bytes travel as a
"binary string": one character (U+0000 to U+00FF) per byte. Every adapter
converts it to its language's byte type once per fixture, in an untimed
prepare step (Node `Buffer.from(s, 'latin1')`, Python `s.encode('latin-1')`,
Ruby `s.encode('ISO-8859-1')` tagged with the source encoding, Rust
`chars().map(|c| c as u8)`), so the measured call starts from bytes. The
encoding is resolved from its name in every call: `iconv-lite` and
`whatwg-encoding` look the name up and keep the codec in iconv-lite's internal
cache; the `TextDecoder` adapter keeps one decoder per name in a `Map`, which
is the same thing done by hand; `encoding_rs` uses `Encoding::for_label`;
Python looks the codec up by name; Ruby reads it from the string's encoding
tag. Packages run with their default settings as installed.

Detection of unknown encodings, BOM handling, base64 and UTF-8 validation
alone are out of scope.

## Entries

- `iconv-lite`: `iconv.decode(buffer, name)`.
- `whatwg-encoding`: `decode(buffer, name)`; it checks the name is supported,
  sniffs a BOM (none is present), then calls `iconvLite.decode` from its own
  bundled iconv-lite 0.6.3 (the direct entry is 0.7.3). Its row is therefore
  iconv-lite at an older version behind a thin wrapper, not a separate decoder.
- Node `TextDecoder`: `decoder.decode(buffer)` on a decoder constructed once
  per encoding name and reused; needs the runtime's full encoding support
  (Node with full ICU, Bun, Deno).
- Python `bytes.decode(name)`, Ruby `String#encode('UTF-8')` on bytes tagged
  with their encoding: standard library.
- `encoding_rs`: `decode_without_bom_handling`, with the result copied into an
  owned `String`.
- Left out: `@wildboar/teletex` (T.61 only), `utf16_iter` and `cesu8` (other
  encodings). Go's standard library has no support for these encodings.
