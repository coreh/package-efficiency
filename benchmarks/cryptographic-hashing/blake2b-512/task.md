# BLAKE2b-512 of byte messages

One operation computes the unkeyed BLAKE2b digest (RFC 7693) of one byte
message with the full 64-byte output, and returns the 64 raw digest bytes.
Messages are arbitrary bytes, from empty to 1 MiB: xorshift noise covering
every byte value, ASCII log text, a 0..255 ramp, runs of zeros and of 0xff, at
lengths around BLAKE2b's 128-byte block (127/128/129, 255/256/257, where the
last block, compressed with the final flag, falls on or past a boundary) and
then growing through 4 KB, 64 KB and 256 KB to 1 MiB. There are 48 fixtures,
built deterministically, about 3.7 MiB in all, so one pass mixes per-call cost
on small messages with bulk throughput on large ones. The messages are made the
same way as in `sha1-messages`; only the boundary lengths differ.

A correct output is exactly the 64 bytes of BLAKE2b-512 over the message. The
expected values come from `node:crypto`'s `blake2b512`, which is also one of
the entries (`builtin/node-crypto`), so that entry is checked against the same
function it calls. To anchor the reference itself, the scenario first checks it
against two published known-answer vectors: `abc` from RFC 7693 Appendix A
(also fixture 1) and the empty message from the BLAKE2 reference test vectors
(also fixture 0). The check is exact; there is no tolerance. The scenario also
proves at load that the check refuses a digest with one bit flipped, a digest
cut to 63 bytes, another fixture's digest, the digest as hex text, the SHA-512
and the SHA3-512 of the same bytes (both also 64 bytes), and BLAKE2s-256.

Fixtures are shared as JSON, so an input is the message as a lowercase hex
string. Every adapter defines `prepare`, which turns it into the language's
byte type once per fixture, before any timing (`Buffer` or `Uint8Array`,
Python `bytes`, a frozen Ruby binary `String`, Go `[]byte`, Rust `Vec<u8>`);
the measured call is given those bytes and does no decoding or encoding.

Accepted as equivalent: the container type of the 64 bytes (`Uint8Array`,
`Buffer`, `ArrayBuffer`, Rust `GenericArray`/array types, Python `bytes`, Ruby
binary string, Go `[64]byte`, or a Go `[]byte`, which `encoding/json` marshals
as base64). Each library returns its own type and nothing is converted to hex
or copied just to match another language; Python and Ruby define `describe`
and Rust a `describe` function only to turn the bytes into a list of integers
for the verifier, outside the timed call.

Every package runs in its plain one-shot form, unkeyed, with no salt or
personalization and the 64-byte output (the default where the API has one; set
explicitly where it must be given, as pycryptodome's `digest_bits=512`). No
result is cached. Keyed BLAKE2b (MAC), shorter outputs, BLAKE2s, BLAKE2bp,
BLAKE3, streaming updates and hex output are outside this task.

## Packages

| Entry | What the adapter calls |
| --- | --- |
| `builtin/node-crypto` | `createHash("blake2b512").update(bytes).digest()`, a `Buffer` |
| `builtin/python-hashlib` | `hashlib.blake2b(bytes).digest()`, `bytes` |
| `builtin/ruby-openssl` | `OpenSSL::Digest.digest("BLAKE2b512", bytes)` from the `openssl` extension that ships with Ruby, a binary `String` |
| `npm/@noble/hashes` | `blake2b(bytes)` from `@noble/hashes/blake2.js`, a `Uint8Array` |
| `jsr/@std/crypto` | `crypto.subtle.digestSync("BLAKE2B", bytes)`, an `ArrayBuffer` |
| `pypi/pycryptodome` | `Crypto.Hash.BLAKE2b.new(digest_bits=512, data=bytes).digest()`, `bytes` |
| `cargo/blake2` | `Blake2b512::digest(&bytes)` (RustCrypto, default features), a `GenericArray<u8, U64>` |
| `gomod/golang.org-x-crypto` | `blake2b.Sum512(bytes)` from `golang.org/x/crypto/blake2b`, a `[64]byte` |

The package entries are written separately; this list says what each is to
call.

## Left out

- No Go standard-library entry: Go's standard library has no BLAKE2; the
  module everyone uses, `golang.org/x/crypto/blake2b`, is the package entry
  above.
- Ruby's `digest` library has no BLAKE2, so the Ruby entry uses the `openssl`
  extension that ships with Ruby (`builtin/ruby-openssl`).
- Python's `hashlib.blake2b` is the standard library's own implementation (the
  BLAKE2 reference code built into CPython), not a package; there is no
  separate PyPI entry for it.
