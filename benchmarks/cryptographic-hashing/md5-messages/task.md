# MD5 digest of messages

One operation computes the MD5 digest (RFC 1321) of one string and returns the
16 raw digest bytes. MD5 is broken for security: collisions can be made at
will, so it must not be used for signatures, passwords or anything an attacker
can choose. It is still widely used for checksums, ETags, cache keys and
content addressing where no attacker is involved, which is why these packages
are still downloaded, and that per-call cost is what this task measures.

Inputs are text messages encoded as UTF-8: empty, one character, lengths
around the 55/56/63/64/65-byte block boundaries, access-log lines, JSON cache
records, accented and CJK text, emoji, and larger messages up to 16 KB, plus
the seven test-suite messages of RFC 1321 (appendix A.5). There are 48
fixtures, built deterministically.

## What counts as correct

A correct output is exactly the 16 bytes of MD5 over the UTF-8 bytes of the
input. The expected values come from `node:crypto`'s MD5, which is also one of
the entries (`builtin/node-crypto`), so that entry is checked against the same
function it calls and the reference is not independent of it. To anchor the
reference itself, the scenario first checks it against the seven published
digests of RFC 1321's test suite. The check is exact; there is no tolerance.
When the scenario loads it also proves the check refuses wrong outputs: the
input unchanged, the input's bytes, one constant digest, another fixture's
digest, the hex string, SHA-1 cut to 16 bytes, MD5 of the UTF-16 or Latin-1
bytes, and a digest one byte short.

Accepted as equivalent: the container type of the 16 bytes (`Uint8Array`,
`Buffer`, `ArrayBuffer`, Rust `[u8; 16]`/array types such as `md5::Digest`,
Python `bytes`, Ruby binary string, Go `[16]byte`). Each library returns its
own type and nothing is converted to hex or copied just to match another
language; Python and Ruby define `describe` and Rust a `describe` function only
to turn the bytes into a list of integers for the verifier, outside the timed
call.

The JavaScript packages that take bytes encode the text to UTF-8 inside the
call with `TextEncoder`; `node:crypto` takes the string directly. Rust, Python,
Ruby and Go strings are already UTF-8 bytes, so no encoding step is needed
there.

Every package runs with default settings as installed, in its plain one-shot
form. No result is cached. Streaming, HMAC, other algorithms and hashing very
large buffers are outside this task: it measures the per-call cost on small and
medium messages, as the sibling task `sha256-messages` does for SHA-256.

## Packages

| Entry | What the adapter calls |
| --- | --- |
| `builtin/node-crypto` | `createHash("md5").update(string).digest()`, a `Buffer` |
| `builtin/python-hashlib` | `hashlib.md5(value.encode("utf-8")).digest()`, `bytes` |
| `builtin/ruby-digest` | `Digest::MD5.digest(value)`, a binary `String` |
| `builtin/go-md5` | `md5.Sum([]byte(value))`, a `[16]byte` |
| `npm/@noble/hashes` | `md5(bytes)` from `@noble/hashes/legacy.js`, a `Uint8Array` |
| `jsr/@std/crypto` | `crypto.subtle.digestSync("MD5", bytes)`, an `ArrayBuffer` |
| `jsr/@takker/md5` | `md5(bytes)`, an `ArrayBuffer` |
| `cargo/md-5` | `Md5::digest(value.as_bytes())` (crate `md-5`, imported as `md5`), a `GenericArray<u8, U16>` |
| `cargo/md5` | `md5::compute(value.as_bytes())`, an `md5::Digest` (`[u8; 16]`) |
| `pypi/pycryptodome` | `Crypto.Hash.MD5.new(value.encode("utf-8")).digest()`, `bytes` |

The package entries are written separately; this list says what each is to
call.

## Left out

- No Go module is in the cluster: Go's `crypto/md5` is the one everyone uses,
  and it is here as `builtin/go-md5`.
- No RubyGems package: `Digest::MD5` is in the standard library and is here as
  `builtin/ruby-digest`.
