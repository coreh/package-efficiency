# SHA-1 of byte messages

One operation computes the SHA-1 digest (FIPS 180-4) of one byte message and
returns the 20 raw digest bytes. Messages are arbitrary bytes, from empty to
1 MiB: xorshift noise covering every byte value, ASCII log text, a 0..255 ramp,
runs of zeros and of 0xff, at lengths around the 55/56/63/64/65-byte padding
and block boundaries and then growing through 4 KB, 64 KB and 256 KB to 1 MiB.
There are 48 fixtures, built deterministically, about 3.7 MiB in all, so one
pass mixes per-call cost on small messages with bulk throughput on large ones.
Where the sibling tasks hash UTF-8 text, this one hashes bytes.

A correct output is exactly the 20 bytes of SHA-1 over the message. The
expected values come from `node:crypto`'s SHA-1, which is also one of the
entries (`builtin/node-crypto`), so that entry is checked against the same
function it calls. To anchor the reference itself, the scenario first checks it
against the three published FIPS 180 known-answer vectors (the empty message,
`abc`, and one million `a`), and the last two are also fixtures. The check is
exact; there is no tolerance. The scenario also proves at load that the check
refuses a digest with one bit flipped, a digest cut to 19 bytes, another
fixture's digest, the digest as hex text, and the SHA-256 of the same bytes.

Fixtures are shared as JSON, so an input is the message as a lowercase hex
string. Every adapter defines `prepare`, which turns it into the language's
byte type once per fixture, before any timing (`Buffer` or `Uint8Array`,
Python `bytes`, a frozen Ruby binary `String`, Go `[]byte`, Rust `Vec<u8>`);
the measured call is given those bytes and does no decoding or encoding.

Accepted as equivalent: the container type of the 20 bytes (`Uint8Array`,
`Buffer`, `ArrayBuffer`, Rust `[u8; 20]`/array types, Python `bytes`, Ruby
binary string, Go `[20]byte`, or a Go `[]byte`, which `encoding/json` marshals
as base64). Each library returns its own type and nothing is converted to hex
or copied just to match another language; Python and Ruby define `describe`
and Rust a `describe` function only to turn the bytes into a list of integers
for the verifier, outside the timed call.

Every package runs with default settings as installed, in its plain one-shot
form. No result is cached. Streaming updates, HMAC, SHA-1 collision detection
(`sha1dc`), other algorithms and hex output are outside this task.

## Entries

- `builtin/node-crypto`: `createHash('sha1').update(bytes).digest()`.
- `builtin/python-hashlib`: `hashlib.sha1(bytes).digest()`.
- `builtin/ruby-digest`: `Digest::SHA1.digest(bytes)`.
- `builtin/go-sha1`: `sha1.Sum(bytes)` from `crypto/sha1`.
- npm `@noble/hashes`: `sha1(bytes)` from `@noble/hashes/legacy.js`.
- JSR `@noble/hashes`: the same module from its JSR distribution.
- JSR `@std/crypto`: `crypto.subtle.digestSync('SHA-1', bytes)`, which returns
  an `ArrayBuffer`.
- PyPI `pycryptodome`: `Crypto.Hash.SHA1.new(bytes).digest()`.
- cargo `sha1`: `Sha1::digest(&bytes)` (RustCrypto, default features).
- cargo `sha1_smol`: `Sha1::from(&bytes).digest().bytes()`, a `[u8; 20]`.

## Left out

- cargo `sha-1`: the deprecated alias of the `sha1` crate, published under the
  old name; it would measure the same code twice.
