# CRC-32C of byte buffers

One operation takes a buffer of bytes and returns its CRC-32C (the Castagnoli
polynomial 0x1EDC6F41 of RFC 3720, appendix B.4, reflected as 0x82F63B78,
with initial value and final xor 0xFFFFFFFF) as an unsigned 32-bit number. It
is the checksum of iSCSI, SCTP, ext4 and Btrfs metadata, Snappy and LevelDB
frames, and the object checksums of Google Cloud Storage and Amazon S3, and
most modern CPUs compute it with a dedicated instruction.

The 101 cases are arbitrary bytes, from empty to 128 KiB, about 690 KiB in
all, built deterministically: the empty buffer, `123456789`, and the four
32-byte vectors of RFC 3720 (zeros, 0xff, ascending and descending bytes);
every length from 1 to 33 (tail handling of 8-byte hardware steps and
word-at-a-time tables), in turn xorshift noise, ASCII log text, a 0..255
ramp, zeros and 0xff; lengths around block and vector boundaries (63 to
4097) and around the sizes at which hardware code switches to three
interleaved streams (504 and 4032, Go's 3 x 168 and 3 x 1344 bytes; 24576,
3 x 8 KiB), each as noise and as a run of 0xff bytes; log text, ramps and
noise of 300 bytes to 128 KiB; a 64 KiB run of 0xff and 100,000 zeros. One
pass mixes per-call cost on small buffers with throughput on larger ones.

## What counts as correct

The result must equal the scenario's own reference exactly: a bit-by-bit
CRC-32C with no table. The reference is checked when the scenario loads
against the published values of the empty buffer (0), `123456789`
(0xE3069283) and the four RFC 3720 vectors (0x8A9136AA, 0x62A8AB43,
0x46DD794E, 0x113FDB5C). There is no tolerance. When the scenario loads it
also checks that a byte-at-a-time table form gives the reference's value on
every fixture, and proves that the check refuses wrong outputs: the CRC-32
(IEEE) of the same bytes, the register without the final xor, the polynomial
used unreflected, the value byte-swapped (the order in which RFC 3720 lists
its vectors), the value as a signed 32-bit number, as hex text, the value
plus one, and another fixture's value.

Fixtures are shared as JSON, so an input is the buffer as a lowercase hex
string. Every adapter defines `prepare`, which turns it into the language's
byte type once per fixture, before any timing (Python `bytes`, Go `[]byte`,
Rust `Vec<u8>`); the measured call is given those bytes and does no decoding.

Every result is the same unsigned integer in every language (Python `int`, Go
`uint32`, Rust `u32`); nothing is converted. Packages run with their default
settings and features as installed, in their one-shot form over the whole
buffer, from the standard initial value. No result is cached; a table or
`Crc` value that a package builds once is built at start, outside timing.
Rolling updates, combining two checksums, streaming over chunks and very large
buffers are not measured.

Hardware acceleration differs by package, and it is the main thing the figures
show. Each entry says below whether it uses the CPU's CRC-32C instructions
(SSE 4.2 `crc32` on x86-64, the ARMv8 CRC extension on arm64) or a software
table. Each runs as it chooses at run time on the measuring machine; none is
forced into or out of its hardware path.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/go-crc32-castagnoli` | `crc32.Checksum(bytes, table)` from `hash/crc32`, with `table = crc32.MakeTable(crc32.Castagnoli)` built once at start; a `uint32`. Hardware instructions on arm64 and amd64. |
| `pypi/crc32c` | `crc32c.crc32c(bytes)`, an `int`. A C extension with SSE 4.2 and ARMv8 hardware code and a software fallback, chosen at import. |
| `pypi/google-crc32c` | `google_crc32c.value(bytes)`, an `int`. A C extension over Google's `crc32c` library, which uses hardware instructions where it detects them; the package falls back to pure Python where the extension is missing. |
| `cargo/crc32c` | `crc32c::crc32c(&bytes)`, a `u32`. Hardware instructions on x86-64 and aarch64, chosen at run time, with a software fallback. |
| `cargo/crc` | `Crc::<u32>::new(&CRC_32_ISCSI).checksum(&bytes)`, with the `Crc` built once as a constant and its default table implementation (software only). |
| `gomod/klauspost-crc32` | `crc32.Checksum(bytes, crc32.MakeTable(crc32.Castagnoli))`, with the table built once at start. A fork of Go's `hash/crc32` with its own assembly. |

The adapter of `pypi/google-crc32c` notes which implementation
`google_crc32c.implementation` reports on each runtime (`c` or `python`), so
a pure-Python fallback is not read as the C code. `pypi/crc32c` likewise
notes its `crc32c.hardware_based` value.

The package entries are written separately; this list says what each is to
call.

## Left out

- Node, Bun, Deno, Python, Ruby and Rust have no CRC-32C in their standard
  libraries (`node:zlib` and `Bun.hash` offer the IEEE CRC-32 only, as do
  Python's `zlib` and `binascii` and Ruby's `Zlib`), so the only built-in
  entry is Go's `hash/crc32`.
- No npm, JSR or RubyGems package is in the cluster.
