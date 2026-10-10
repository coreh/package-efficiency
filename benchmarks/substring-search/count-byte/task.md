# Count one byte in a buffer

One operation takes a buffer and returns how many of its bytes are the newline
byte 0x0a, as an integer. This is line counting (`wc -l`), the most common use
of a one-byte count. The 23 buffers are deterministic and run from 1 KiB to
8 MiB, about 12.5 MiB in all, in five kinds in turn: log text with short lines,
xorshift32 noise over every byte value (about one newline in 256 bytes), UTF-8
prose with long lines, CRLF header text with blank lines and some bare LF line
ends, and special buffers (all zeros, so no newline; all newlines; 0xff with a
newline every 255 bytes and at both ends). Lengths include odd ones (1023,
1025, 1031, 4097, 65537, 1048577 bytes) for the tail of word-at-a-time and
SIMD loops. One pass therefore mixes per-call cost on small buffers with bulk
throughput on large ones.

A correct output is exactly the count of 0x0a bytes, compared with the
scenario's own byte-by-byte count; there is no tolerance. The scenario proves
at load that the check refuses a count one too high (which is also the number
of lines of a text without a final newline) or one too low, the count of
carriage returns (0x0d), another fixture's count and the count as text.

Fixtures are shared as JSON, so an input is the buffer as a lowercase hex
string. Every adapter defines `prepare`, which turns it into the language's
byte type once per fixture, before any timing (Python `bytes`, a frozen Ruby
binary `String`, Go `[]byte`, Rust `Vec<u8>`); the measured call is given
those bytes and does no decoding. The byte to count is fixed (0x0a) and is
written into each adapter, not passed in.

Every package runs with its default features as installed, in its plain
one-call form. Nothing is cached between calls. Counting several bytes or a
longer literal, counting UTF-8 characters, and finding positions are other
tasks (`literal-counts`, `match-positions`).

## Entries

- cargo `bytecount`: `bytecount::count(&bytes, b'\n')`.
- cargo `memchr`: `memchr::memchr_iter(b'\n', &bytes).count()`.
- `builtin/go-bytes-count`: `bytes.Count(bytes, []byte{'\n'})`, which takes
  the one-byte path of the standard library (`bytealg.Count`).
- `builtin/python-bytes-count`: `bytes.count(b"\n")`.
- `builtin/ruby-string-count`: `String#count("\n")` on a binary
  (ASCII-8BIT) string, so every byte is one character.

## Left out

- JavaScript standard library: neither Node, Bun nor Deno has a function that
  counts a byte in a buffer, and an entry would be a loop written by hand
  around `Buffer#indexOf`, not a standard-library call.
- No npm or JSR package in the category does this job.
