# CRC-32 of byte buffers

One operation takes a buffer and returns its CRC-32 (the IEEE 802.3 polynomial
used by gzip, zlib, PNG and Ethernet: reflected 0xEDB88320, initial value and
final xor 0xFFFFFFFF) as an unsigned 32-bit number. The 51 cases are short
ASCII of every length up to 17 (tail handling), the standard `123456789` check
string, runs of zero and 0xFF-range bytes, JSON documents, log lines and
Unicode prose of tens of bytes to a few kilobytes, two 8 KB and 16 KB buffers,
and empty input.

The result must equal an independent bitwise reference exactly. The task shape
is one whole buffer in, one number out; incremental updates, very large buffers,
CRC-32C, Adler-32 and other polynomials are not measured.

Fixtures are shared with the Rust runner as JSON, so an input is a string and
its bytes are its UTF-8 encoding. Packages and built-ins that accept strings
(`buffer-crc32`, `@deno-library/crc32`, Node `zlib.crc32`) are called with the
string and encode it themselves; Python encodes explicitly; Ruby's and Go's
strings already are bytes; Rust uses `str::as_bytes()` at no cost.

Equivalent shapes are accepted: `@deno-library/crc32` returns an 8-digit hex
string, which its adapter parses to a number inside the measured call so every
language returns the same unsigned integer. Packages run with their default
settings as installed, with no cached results between calls.

## Rust entries

- `crc32fast`: `crc32fast::hash(bytes)`.
- `crc`: `Crc::<u32>::new(&CRC_32_ISO_HDLC).checksum(bytes)`, with the `Crc`
  built once as a constant and its default table implementation.
