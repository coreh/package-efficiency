# Argon2id raw hash with given salt and parameters

One operation computes the Argon2id tag (RFC 9106) of a password with a given
16-byte salt and returns the 32 raw tag bytes. An input is an object
`{ password, salt, memory, passes, parallelism, length }`: the password is
text, the salt is 16 bytes written as lowercase hex, and the parameters are
the same in every fixture: `memory` 19456 KiB (19 MiB), `passes` 2,
`parallelism` 1, `length` 32, version 0x13, no secret key and no associated
data. These are the OWASP minimum settings for Argon2id. There are 11
fixtures, built deterministically: an ASCII password, an empty password, a
passphrase, accented, CJK and emoji text, a tab and a trailing space, a
password with a NUL character inside, a 128-character password, the first
password again with another salt, and the first salt with a password that
differs from the first only in case.

A correct output is exactly the 32 bytes of Argon2id over the UTF-8 bytes of
the password and the salt bytes. The check is exact; there is no tolerance.
The expected tags are written into the scenario. They were recorded from two
independent implementations that agreed on every fixture: `node:crypto`'s
`argon2Sync` (OpenSSL's Argon2) and `@noble/hashes` 2.4.0 (pure JavaScript).
Both also reproduce the Argon2id test vector of RFC 9106 section 5.3, and the
scenario checks that vector against `argon2Sync` when it loads on a runtime
that has it (Node 24.7 and later, Bun). The vector itself is not a fixture: it
uses a secret key, associated data and four lanes, which not every entry can
be given. The scenario also proves at load that the check refuses a tag with
one bit flipped, a tag cut to 31 bytes, another fixture's tag, the tag as hex
text, and the tags of the first fixture made with Argon2i, with Argon2d, with
version 0x10, with three passes, with 19000 KiB and with a 64-byte length.

The salt is given, not generated, so the task measures the hash alone: no
random salt, no encoded `$argon2id$...` string and no verify step. Every
adapter defines `prepare`, which turns the hex salt into the language's byte
type once per fixture, before any timing. The password stays text; turning it
into UTF-8 bytes, where a library takes bytes, is inside the timed call, as
in `key-derivation/pbkdf2-sha256`. Each adapter passes all four parameters
explicitly (the libraries' defaults differ: 64 MiB and three passes, or
others) and leaves everything else at its default. Libraries that compute
lanes on threads have nothing to share out at `parallelism` 1.

Accepted as equivalent: the container type of the 32 bytes (`Buffer`,
`Uint8Array`, Python `bytes`, or a Go `[]byte`, which `encoding/json` marshals
as base64). Nothing is converted to hex just to match. A Python adapter
returns the `bytes` the library made and defines `describe` only to turn them
into a list of integers for the verifier, outside the timed call.

One call fills and passes twice over 19 MiB, so it costs tens of milliseconds
(about 25 ms for `node:crypto` and 120 ms for `@noble/hashes` on an Apple M
machine) and the load is small: 11 calls per pass over the fixtures. Memory
after GC is read after the last round, when the 19 MiB of the last call is
normally released; what a library keeps for reuse counts.

## Packages

| Entry | What the adapter calls |
| --- | --- |
| `builtin/node-crypto` | `argon2Sync("argon2id", { message, nonce, memory, passes, parallelism, tagLength })` from `node:crypto`, a `Buffer`. Node and Bun |
| `npm/@noble/hashes` | `argon2id(password, salt, { t: 2, m: 19456, p: 1, dkLen: 32 })` from `@noble/hashes/argon2.js`, a `Uint8Array` |
| `jsr/@noble/hashes` | The same call from the JSR release of the same package |
| `pypi/argon2-cffi` | `argon2.low_level.hash_secret_raw(password.encode("utf-8"), salt, time_cost=2, memory_cost=19456, parallelism=1, hash_len=32, type=Type.ID)`, `bytes` |

The package entries are written separately; this list says what each is to
call.

## Left out

- Deno: its `node:crypto` has no `argon2Sync`, so `builtin/node-crypto` lists
  Node and Bun only.
- `Bun.password`: it does Argon2id only as an encoded hash string with a
  random salt and a verify call; it cannot be given a salt or return the raw
  tag.
- Python's `hashlib`, Ruby's `openssl` extension (it has `pbkdf2_hmac`,
  `scrypt` and `hkdf` only) and Go's standard library have no Argon2, so there
  is no standard-library entry in those languages.
- `@rabbit-company/argon2id` and `@felix/argon2` (JSR): their API is
  asynchronous (`@felix/argon2` also binds a native library through Deno FFI),
  which this synchronous task cannot time.
- `argon2-cffi-bindings` (PyPI): the low-level binding that `argon2-cffi`
  calls; it is measured through `argon2-cffi` and is not a second entry.
