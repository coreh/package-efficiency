# HKDF-SHA-256 extract and expand

One operation derives an output key from input keying material, a salt and an
info string with HKDF using HMAC-SHA-256 (RFC 5869: HKDF-Extract makes a
pseudorandom key from the salt and the input keying material, HKDF-Expand
stretches it with the info to the requested length) and returns the raw key
bytes. HKDF is not a password KDF: it takes a secret that is already strong,
such as an ECDH shared secret, and turns it into keys. It is the KDF of TLS 1.3,
HPKE, Signal, Noise and Web Push.

An input is an object `{ ikm, salt, info, length }`. `ikm`, `salt` and `info`
are hex strings; they are turned into bytes once per fixture, before any
timing, in every language, and the measured call is given the byte arrays (Go's
`hkdf.Key` takes the info as a `string`, made from the bytes before timing).
`length` is the number of output bytes, from 16 to 255. There are 40 fixtures:

- the three SHA-256 test vectors of RFC 5869, appendix A (test case 3 has an
  empty salt and an empty info);
- 37 built deterministically from a fixed-seed generator: input keying material
  of 16 to 96 bytes; salts that are empty, 13, 16, 32 or 64 bytes long (one
  HMAC block), or 65 and 100 bytes (longer than a block, which HMAC hashes
  first); info that is empty, a TLS 1.3-style label, an application string with
  non-ASCII text, or 3 to 80 binary bytes; output lengths of 16, 31, 32, 33, 42,
  64, 65, 82, 96, 128, 200 and 255 bytes, so one to eight blocks of HKDF-Expand
  and lengths on either side of a block boundary.

## What counts as correct

A correct output is exactly the `length` bytes of HKDF-SHA-256 for the given
input keying material, salt and info. The expected values come from
`node:crypto`'s `hkdfSync`, which is also one of the entries, so the scenario
first checks it against the three RFC 5869 vectors (and the pseudorandom key of
test case 1), and checks for two fixtures that HMAC-SHA-256 extract followed by
a hand-written expand gives the same bytes. HKDF is deterministic, so no
spelling differences are accepted: the bytes must be identical. An empty salt
is the same as a salt of 32 zero bytes (RFC 5869, section 2.2); every entry is
given the empty salt as it is. Outputs are compared as hex (JavaScript, Rust,
Python, Ruby) or base64 (Go, whose `[]byte` results are marshalled that way);
the conversion is done once per fixture before any timing. Every fixture's key
differs, so a constant or an echo of the input fails.

Accepted as equivalent: the container of the bytes (`ArrayBuffer`, which
`hkdfSync` returns, `Uint8Array`, `Buffer`, Rust `Vec<u8>`, Python `bytes`,
Ruby binary string, Go `[]byte`). Nothing is converted to hex inside the timed
call.

When the scenario loads it proves that the check refuses wrong outputs, on RFC
5869 test case 1 and on a generated fixture: the key with one bit flipped, one
byte short and one byte too long, HKDF with SHA-512 and with SHA-1, the
pseudorandom key of HKDF-Extract alone, HKDF-Expand without the extract step
(the input keying material used as the pseudorandom key), salt and input
keying material swapped, the info left out, another fixture's output, and the
bytes as a list of numbers.

Packages run with their default settings as installed. Each call does both
steps from the raw inputs; nothing is cached between calls, and no adapter keeps
the pseudorandom key or an HMAC state from one call to the next. Only the
combined extract-and-expand is measured; separate extract or expand calls,
other hashes, and the TLS 1.3 `HKDF-Expand-Label` wrapper are outside the task.
PBKDF2 is the task `pbkdf2-sha256`.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/node-crypto` | `hkdfSync('sha256', ikm, salt, info, length)`, an `ArrayBuffer` (Node, Bun and Deno) |
| `builtin/go-hkdf` | `hkdf.Key(sha256.New, ikm, salt, info, length)` from `crypto/hkdf` (Go 1.24+) |
| `builtin/ruby-openssl` | `OpenSSL::KDF.hkdf(ikm, salt:, info:, length:, hash: 'SHA256')` |
| npm `@noble/hashes` | `hkdf(sha256, ikm, salt, info, length)` from `@noble/hashes/hkdf.js` and `@noble/hashes/sha2.js` |
| JSR `@noble/hashes` | the same calls from the JSR package |
| PyPI `pycryptodome` | `HKDF(ikm, length, salt, SHA256, context=info)` from `Crypto.Protocol.KDF`, `Crypto.Hash.SHA256` |
| cargo `hkdf` | `Hkdf::<Sha256>::new(Some(salt), ikm).expand(info, &mut okm)` into a `Vec<u8>` of `length` zero bytes (RustCrypto, with `sha2`) |

The package entries are written separately; this list says what each is to
call.

## Left out

- Python has no HKDF in its standard library (`hashlib` and `hmac` offer only
  the primitives, and the job is not written by hand), so there is no Python
  builtin entry.
- Password KDFs (PBKDF2, scrypt, bcrypt, Argon2) are other jobs; HKDF of a
  password would not be one.

See [shared methodology](../../README.md) for timing and reproduction.
