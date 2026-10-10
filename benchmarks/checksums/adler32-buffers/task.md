# Adler-32 of byte buffers

One operation takes a buffer of bytes and returns its Adler-32 checksum (RFC
1950, section 8.2: two running sums modulo 65521, the first starting at 1, the
second the sum of the first; the second in the high 16 bits) as an unsigned
32-bit number. It is the checksum at the end of every zlib stream, and is used
for its speed where CRC-32 would be slower.

The 103 cases are arbitrary bytes, from empty to 128 KiB, about 730 KiB in
all, built deterministically: the empty buffer, `Wikipedia`, `abc` and
`123456789`; every length from 1 to 33 (tail handling of word-at-a-time and
SIMD code), in turn xorshift noise, ASCII log text, a 0..255 ramp, zeros and
0xff; lengths around block and vector boundaries (63 to 4097) and around
5552, 11104 and 16656, the multiples of zlib's NMAX, the largest count of
bytes after which a deferred modulo still cannot overflow 32-bit sums, each as
noise and as a run of 0xff bytes (the bytes that make the sums grow fastest);
log text, ramps and noise of 300 bytes to 128 KiB; a 64 KiB run of 0xff and
100,000 zeros. One pass mixes per-call cost on small buffers with throughput on
larger ones.

## What counts as correct

The result must equal the scenario's own reference exactly: a byte-by-byte
Adler-32 that reduces both sums after every byte, so it has no deferred modulo
that could overflow. The reference is checked when the scenario loads against
the published values of the empty buffer (1), `Wikipedia` (0x11E60398), `abc`
and `123456789`. There is no tolerance. When the scenario loads it also proves
that the check refuses wrong outputs: a deferred modulo that waits 5600 bytes
instead of 5552 (it overflows on the run of 0xff), sums modulo 65536 instead of
65521, the two halves swapped, the value as a signed 32-bit number, the value
as hex text, the value plus one, another fixture's value, and the CRC-32 of the
same bytes. It also checks that a deferred modulo every 5552 bytes gives the
reference's value on every fixture, so the fixtures do not favour the plain
form over the usual fast one.

Fixtures are shared as JSON, so an input is the buffer as a lowercase hex
string. Every adapter defines `prepare`, which turns it into the language's
byte type once per fixture, before any timing (`Buffer`, Python `bytes`, a
frozen Ruby binary `String`, Go `[]byte`, Rust `Vec<u8>`); the measured call is
given those bytes and does no decoding.

Every result is the same unsigned integer in every language (a JavaScript
number, Python `int`, Ruby `Integer`, Go `uint32`, Rust `u32`); nothing is
converted. Packages run with their default settings and features as installed,
in their one-shot form over the whole buffer, from the standard initial value
1. No result is cached. Rolling updates, combining two checksums, streaming
over chunks and very large buffers are not measured.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/python-zlib` | `zlib.adler32(bytes)`, an `int` |
| `builtin/ruby-zlib` | `Zlib.adler32(bytes)`, an `Integer` |
| `builtin/go-adler32` | `adler32.Checksum(bytes)` from `hash/adler32`, a `uint32` |
| `builtin/bun-hash-adler32` | `Bun.hash.adler32(bytes)`, a number (Bun only) |
| `cargo/adler` | `adler::adler32_slice(&bytes)` |
| `cargo/adler2` | `adler2::adler32_slice(&bytes)` |
| `cargo/adler32` | `adler32::RollingAdler32::from_buffer(&bytes).hash()` |
| `cargo/simd-adler32` | `simd_adler32::adler32(&bytes)`, with its default features (runtime choice of SIMD code) |

`adler` and `adler2` are the same author's code: `adler2` is the maintained
continuation of `adler` under a new name, which is what `miniz_oxide` now
depends on. Both are published and downloaded separately, so both are
measured, and their figures may be close.

`adler32` also offers `adler32::adler32(reader)`, which reads through
`std::io::Read` into a buffer of its own; its adapter uses
`RollingAdler32::from_buffer` instead, which checksums the slice in place as
the other crates do.

The package entries are written separately; this list says what each is to
call.

## Left out

- Node and Deno have no Adler-32 in their standard libraries (`node:zlib`
  exposes `crc32` only), so the only JavaScript entry is Bun's built-in
  `Bun.hash.adler32`, which runs on Bun alone.
- No PyPI package, RubyGem or Go module is in the cluster: Python's and Ruby's
  `zlib` and Go's `hash/adler32` are what those ecosystems use, and they are
  here as built-ins.
