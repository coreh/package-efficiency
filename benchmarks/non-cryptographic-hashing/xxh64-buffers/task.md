# XXH64 of byte buffers

One operation takes a buffer of bytes and returns its XXH64 hash with seed 0
(xxHash's 64-bit algorithm, as specified in `doc/xxhash_spec.md` of the
xxHash repository) as an unsigned 64-bit integer. XXH64 is the hash of
content fingerprints and checksums in LZ4 and Zstandard frames, in
ClickHouse, RocksDB and Prometheus, and the default hash of Go's
`cespare/xxhash`, which much of the Go ecosystem depends on.

The 119 cases are arbitrary bytes, from empty to 1 MiB, about 1.7 MiB in
all, built deterministically: the empty buffer, `a`, `abc`, `123456789`,
the example sentence of python-xxhash's README and xxHash's own 222-byte
sanity buffer; every length from 1 to 64, in turn xorshift noise, ASCII log
text, a 0..255 ramp, zeros and 0xff (below 32 bytes XXH64 skips its four
accumulators, and the tail is taken in 8-byte, 4-byte and single-byte steps,
so every remainder modulo 32 is covered with and without a full stripe);
lengths around stripe, block and vector boundaries (95 to 16385), each as
noise and as a run of 0xff bytes; log text and ramps of 300 bytes to 50 KB;
noise of 64 KiB, 256 KiB and 1 MiB; a 64 KiB run of 0xff and 100,000 zeros.
One pass mixes per-call cost on small buffers with throughput on larger
ones; by bytes the 1 MiB buffer is most of it.

## What counts as correct

The result must equal the scenario's own reference exactly: XXH64 written
out from the specification with BigInt arithmetic modulo 2^64. The
reference is checked when the scenario loads against published values: the
empty input (0xEF46DB3751D8E999), `a`, `abc`, python-xxhash's example
sentence (0xFBCEA83C8A378BF1), and xxHash's sanity checks over its generated
buffer at lengths 1, 4, 14 and 222 with seed 0 and at length 1 with seed
PRIME32. There is no tolerance. When the scenario loads it also proves that
the check refuses wrong outputs: the hash with seed 1, with lanes read
big-endian, without the final avalanche, its low 32 bits only, the value
byte-swapped, the value plus one, as hex text with and without `0x`, as a
JSON number (which loses the low bits above 2^53), a value at or above 2^63
read as a signed 64-bit integer, and another fixture's value.

Fixtures are shared as JSON, so an input is the buffer as a lowercase hex
string. Every adapter defines `prepare`, which turns it into the language's
byte type once per fixture, before any timing (`Buffer`, Python `bytes`, Go
`[]byte`, Rust `Vec<u8>`); the measured call is given those bytes and does
no decoding.

The measured call returns the library's own unsigned 64-bit integer, with
nothing converted (a JavaScript `BigInt`, Python `int`, Go `uint64`, Rust
`u64`). The verifier reads native results as JSON, where a number above
2^53 would lose its low bits, so the check takes the value as an unsigned
decimal string, written outside timing, once per fixture: Python's
`describe` returns `str(result)`, Rust's `describe` returns
`json!(h.to_string())`, and the Go adapter returns its `uint64` as a named
type whose `MarshalJSON` writes the quoted decimal (the Go runner marshals
each result with `encoding/json` once per fixture, before any measured
work). A JavaScript entry is checked in-process and returns the `BigInt`
itself, which must be in the unsigned 64-bit range and is compared by its
decimal digits. Hex text, a signed value or a plain JSON number is refused.

The scenario stores each expected hash the same way, as its unsigned decimal
string (`"17241709254077376921"` for the empty input), not as a `BigInt`:
the fixtures are written to JSON for the native runtimes, and a `BigInt`
cannot be serialized there. The comparison is exact, digit for digit.

Packages run with their default settings and features as installed, in
their one-shot form over the whole buffer, with seed 0. No result is cached.
Streaming over chunks, other seeds, XXH32, XXH3 and XXH128 are not measured.
How each package reaches its speed (assembly, SIMD, `unsafe` loads, a
pure-language loop) is its own choice and is the main thing the figures
show; none is forced into or out of a code path.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/bun-hash-xxhash64` | `Bun.hash.xxHash64(bytes)`, a `BigInt` (Bun only) |
| `gomod/cespare-xxhash` | `xxhash.Sum64(bytes)` (module `github.com/cespare/xxhash/v2`), a `uint64` |
| `gomod/oneofone-xxhash` | `xxhash.Checksum64(bytes)` (module `github.com/OneOfOne/xxhash`), a `uint64` |
| `pypi/xxhash` | `xxhash.xxh64_intdigest(bytes)`, an `int`; `describe` returns `str(result)` |
| `cargo/twox-hash` | `twox_hash::XxHash64::oneshot(0, &bytes)`, a `u64` |
| `cargo/xxhash-rust` | `xxhash_rust::xxh64::xxh64(&bytes, 0)`, a `u64`, with the crate's `xxh64` feature |

The package entries are written separately; this list says what each is to
call.

## Left out

- Node, Deno, Python, Ruby, Go and Rust have no XXH64 in their standard
  libraries, so the only built-in entry is Bun's `Bun.hash.xxHash64`, which
  runs on Bun alone.
- XXH3: `pypi/xxhash`, `twox-hash` and `xxhash-rust` also compute XXH3-64,
  but `cespare/xxhash` and `OneOfOne/xxhash` do not, so XXH64 is the
  algorithm all five share; XXH3 would be a separate task.
- No npm, JSR or RubyGems package is in the cluster.
