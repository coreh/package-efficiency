# MurmurHash3 of short keys

One operation hashes a short ASCII string key with MurmurHash3 x86 32-bit, seed 0,
and returns an unsigned 32-bit integer. The 80 cases are cache keys, URL paths,
identifiers and hex strings of varied length, including lengths 0 to 3 and every
remainder modulo 4. Results must equal an independent reference implementation
(also checked against published test vectors) exactly.

The listed packages share only this algorithm, so the task fixes it. Inputs are
ASCII so that the bytes a Rust crate sees and the UTF-16 code units a JavaScript
package sees are the same. Packages run with default settings as installed.

- `imurmurhash` (npm): `MurmurHash3(input).result()`, normalized with `>>> 0`
  (it returns a signed or unsigned number depending on version).
- `hash32` (crates.io): `Murmur3Hasher` fed the key bytes, then `finish32()`.

SipHash, FNV, xxHash and others from the category are not compared: they are
different algorithms with different outputs. See [shared methodology](../../README.md).
