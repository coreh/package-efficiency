# BLAKE3 digest of byte messages

One operation computes the BLAKE3 hash (hash mode: no key, no context
string) of one byte message with the default 32-byte output, and returns the
32 raw digest bytes. Messages are arbitrary bytes, from empty to 4 MiB, at
lengths chosen to cross BLAKE3's structure: the 64-byte block (63/64/65), the
1024-byte chunk (1023/1024/1025), the first levels of the chunk tree (2, 3,
4, 6, 8, 9, 16 and 100 chunks), and then on and beside powers of two in
chunks (32 KiB, 64 KiB, 256 KiB, 1 MiB, where the tree is complete and one
more byte adds a level) up to 4 MiB. Fixtures 0 to 17 are the official test
vector inputs (bytes `i % 251`), fixture 18 is `abc`, and the other 21 are
xorshift noise, ASCII log text, a 0..255 ramp, runs of zeros and of 0xff,
made the same way as in `blake2b-512`. There are 40 fixtures, built
deterministically, about 7.8 MiB in all, so one pass mixes per-call cost on
small messages with bulk throughput on large ones (the 4 MiB message is about
half of a pass).

A correct output is exactly the 32 bytes of BLAKE3 over the message. No
runtime's standard library has BLAKE3, so the expected values come from a
small reference written from the specification inside the scenario. When the
scenario loads, that reference is checked against all 35 cases of the official
test vectors (`test_vectors/test_vectors.json` in the BLAKE3 repository, the
first 32 bytes of each case's `hash`, from 0 bytes to 100 KiB) and against
`abc`; the 18 fixtures that are vector inputs are also checked against the
vectors directly. The check is exact; there is no tolerance. The scenario also
proves at load that the check refuses a digest with one bit flipped, a digest
cut to 31 bytes, the 64-byte extended output of the same message, another
fixture's digest, the digest as hex text, the top node's chaining value
without the ROOT flag, the official `keyed_hash` and `derive_key` outputs of
the same input, and the SHA-256 and BLAKE2s-256 of the same bytes (both also
32 bytes).

Fixtures are shared as JSON, so an input is the message as a lowercase hex
string. Every adapter defines `prepare`, which turns it into the language's
byte type once per fixture, before any timing (`Buffer` or `Uint8Array`,
Python `bytes`, Go `[]byte`, Rust `Vec<u8>`); the measured call is given those
bytes and does no decoding or encoding.

Accepted as equivalent: the container type of the 32 bytes (`Uint8Array`,
`Buffer`, `ArrayBuffer`, Rust `blake3::Hash`, Python `bytes`, Go `[32]byte`,
or a Go `[]byte`, which `encoding/json` marshals as base64). Each library
returns its own type and nothing is converted to hex or copied just to match
another language; Python defines `describe` and Rust a `describe` function
only to turn the bytes into a list of integers for the verifier, outside the
timed call.

Every package runs in its plain one-shot form on one thread, with the
32-byte default output. Implementations differ in how they use the CPU, and
that is part of what is measured: the Rust crate (and the Python package,
which wraps it) dispatch to SIMD code (NEON on arm64, SSE/AVX on x86-64)
that hashes several chunks at once; the JavaScript packages run plain
JavaScript or WebAssembly. Multithreading is off everywhere: the Rust crate
is built with its default features (no `rayon`, so `blake3::hash` uses one
thread), and the Python package's `max_threads` stays at its default of 1.
No result is cached. Keyed hashing, key derivation, extended (XOF) output,
streaming updates, multithreaded hashing and hex output are outside this task.

## Packages

| Entry | What the adapter calls |
| --- | --- |
| `npm/@noble/hashes` | `blake3(bytes)` from `@noble/hashes/blake3.js`, a `Uint8Array` |
| `jsr/@std/crypto` | `crypto.subtle.digestSync("BLAKE3", bytes)`, an `ArrayBuffer` |
| `cargo/blake3` | `blake3::hash(&bytes)` (default features: SIMD on, `rayon` off), a `blake3::Hash`, whose `as_bytes()` the `describe` function lists |
| `pypi/blake3` | `blake3.blake3(bytes).digest()` (default `max_threads=1`), `bytes` |
| `gomod/lukechampine.com-blake3` | `blake3.Sum256(bytes)` from `lukechampine.com/blake3`, a `[32]byte` |

The package entries are written separately; this list says what each is to
call.

## Left out

- No standard-library entries: neither `node:crypto` (OpenSSL has no BLAKE3),
  Bun's `CryptoHasher`, Deno's `crypto.subtle`, Python's `hashlib`, Ruby's
  `digest` and `openssl`, nor Go's standard library offers BLAKE3.
- `cargo/blake3` with the `rayon` feature (`Hasher::update_rayon`) and the
  Python package with `max_threads=blake3.AUTO` are left out: they spread one
  hash over several cores, which is different work from the single-threaded
  hash every other entry does, and the CPU figure would not be comparable.
- Other Go modules (`github.com/zeebo/blake3`) can join the same way; only
  one Go entry is listed here.
