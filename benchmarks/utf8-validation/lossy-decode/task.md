# Lossy UTF-8 decoding

One operation takes a byte buffer and returns the text it decodes to, with each
invalid sequence replaced by U+FFFD. The 56 fixtures are 24 well-formed buffers
(ASCII prose, accented Latin, CJK, Cyrillic, Greek and emoji in different
mixes, 60 bytes to 12 KB), the same 24 damaged with about one invalid sequence
per 100 bytes (truncated sequences, stray continuation bytes, overlongs, UTF-16
surrogates, values above U+10FFFF, 0xFF), and eight edge cases (empty, one byte,
a truncated tail, a BOM that must be kept, every sequence length at its limits).

Fixtures are shared as JSON, so each buffer is a lowercase hex string. Every
adapter turns it into bytes once per fixture, before any measured work, so the
measured call is the decoding alone. The buffers are reused by every call; the
Ruby entry therefore takes a fresh view of its buffer in each call (no byte
copy), because a Ruby string remembers that it was valid once it has been
checked.

A correct output is exactly the string the WHATWG decoder produces: one U+FFFD
per maximal invalid subpart, so a truncated three-byte sequence gives a single
U+FFFD, and a surrogate or overlong encoding gives one per byte. The expected
text comes from a small decoder written out in the scenario, which follows the
WHATWG algorithm and does not use `TextDecoder`, and is compared code point for
code point. Returning the
input, a constant, or text that skips the replacement fails.

Packages run with their default settings as installed. Results are owned
strings; where a library can return a borrowed value for valid input (bstr), the
adapter copies it into a String so every Rust adapter returns the same thing.

## Left out

- `simdutf8` only validates (it returns the valid prefix or an error); lossy
  decoding would be done by the standard library around it.
- `encode_unicode` reports an error for every byte of a bad sequence, so its
  output differs from the common replacement rule unless the adapter merges the
  errors itself, which would be implementing the job around it.
- Go's standard library replaces per byte (or per run), not per maximal
  subpart, so no Go adapter is included.
