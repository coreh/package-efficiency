# MurmurHash3 of long text

One operation hashes a long ASCII string (a document, log, JSON blob or hex dump of
1 KB to 256 KB) with MurmurHash3 x86 32-bit, seed 0, and returns an unsigned 32-bit
integer. The 36 cases are built deterministically from word lists, log lines, JSON-like
records and hex data, with lengths covering every remainder modulo 4. Results must
equal an independent reference implementation (also checked against published test
vectors) exactly. Unlike the short-keys task, per-call overhead is negligible: the cost
is the per-byte hashing loop.

Inputs are ASCII so that the bytes a Rust crate sees and the UTF-16 code units a
JavaScript package sees are the same. Packages run with default settings as installed.
Each input is hashed in a single call; nothing is cached between calls.

- `imurmurhash` (npm): `MurmurHash3(input).result()`, normalized with `>>> 0`.
- `hash32` (crates.io): `Murmur3Hasher` fed the whole byte slice, then `finish32()`.

Other algorithms in the category are different outputs and are not compared.
See [shared methodology](../../README.md).
