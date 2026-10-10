# Salsa20 encrypt

One operation encrypts one message with Bernstein's Salsa20/20 stream cipher
(a 256-bit key, a 64-bit nonce and a 64-bit block counter that starts at 0)
and returns the ciphertext, which has the length of the message. There is no
authentication tag. Salsa20 is the cipher of the eSTREAM portfolio, the
keystream inside NaCl's `secretbox` (as XSalsa20) and the cipher of formats
that authenticate separately or not at all.

An input is an object with three strings: `key` (32 ASCII characters, used as
the 32 key bytes), `nonce` (8 ASCII characters, the 64-bit nonce) and `text`
(the message). The strings are turned into bytes once per fixture, before any
timing, in every language, as UTF-8. The measured call is given the byte
arrays. The 48 cases are the messages and keys of
`symmetric-ciphers/chacha20-stream` (and so of
`authenticated-encryption/chacha20-poly1305-seal`), byte for byte, with the
first 8 characters of that task's 12-character nonce: JSON-like and log-like
messages from 0 to about 8 KB (lengths around the 64-byte Salsa20 block, some
with non-ASCII text), each with its own key and nonce. The tasks can be read
side by side.

## What counts as correct

No standard library has Salsa20 (Node's OpenSSL has none), so the scenario
carries its own short Salsa20 (the quarter-round, row and column rounds and
little-endian state of Bernstein's specification) and computes the expected
ciphertext with it. When the scenario loads it checks that reference against
the eSTREAM verified test vectors for Salsa20/20 with a 256-bit key, set 1
vector 0 (key `80 00 … 00`, zero IV): bytes 0 to 63 of the keystream, and
bytes 192 to 255, which fix the block counter. Salsa20 is deterministic for a
fixed key, nonce and counter, so no differences are accepted: the bytes must
be identical, which also fixes the length. Outputs are compared as hex
(JavaScript, Rust, Python) or base64 (Go, whose `[]byte` results are
marshalled that way); the conversion is done once per fixture before any
timing.

When the scenario loads it proves that the check refuses wrong outputs: the
last byte flipped, the keystream started at counter 1 instead of 0, the nonce
with its bytes reversed, the ciphertext one byte short, Salsa20/12 and
Salsa20/8 (reduced rounds) of the same input, ChaCha20 of the same input (with
the 64-bit nonce), the plaintext itself, another fixture's output, and the
bytes as a list of numbers. The ChaCha20 for that proof is also the
scenario's own (Bernstein's layout, a 64-bit counter and a 64-bit nonce),
anchored by RFC 8439 A.2 test vector #1, so the scenario uses no cipher from
`node:crypto` and loads on every runtime, Bun included.

Only encryption is measured (decryption is the same operation). XSalsa20
(24-byte nonce), the reduced-round variants Salsa20/12 and Salsa20/8, 128-bit
keys and seeking to another counter are outside this task.

Packages run with their default settings and features as installed. Each call
creates its cipher object from the key and nonce where the package has one,
as the packages' documentation shows for one message with its own nonce;
nothing is cached between calls. For the short messages (10 of the 48 are
under 100 bytes) creating that object, not encrypting, is a large part of the
cost; that is the cost of encrypting one message. The RustCrypto crate
encrypts in place or buffer to buffer, so each call writes the keystream
applied to the plaintext into a new `Vec<u8>` and returns it.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| JSR `@noble/ciphers` | `salsa20(key, nonce, text)` from `@noble/ciphers/salsa.js` (8-byte nonce, counter 0 by default) |
| PyPI `pycryptodome` | `Salsa20.new(key=key, nonce=nonce).encrypt(text)` from `Crypto.Cipher` (32-byte key, 8-byte nonce; counter 0) |
| cargo `salsa20` | `Salsa20::new(key, nonce)` (RustCrypto, `KeyIvInit`; `Salsa20` is the 20-round type), then the keystream applied from the plaintext into a new `Vec<u8>` (`apply_keystream_b2b`, or a copy and `apply_keystream`) |
| Go `golang.org/x/crypto` | `salsa20.XORKeyStream(out, in, nonce, key)` from `golang.org/x/crypto/salsa20` with the 8-byte nonce and a `*[32]byte` key, into a new slice |

There is no builtin entry. The package entries are written separately; this
list says what each is to call.

## Left out

- Node, Bun, Deno, Python, Ruby and Go have no Salsa20 in their standard
  libraries (OpenSSL, which Node's and Ruby's `crypto` wrap, has none), so
  the task has no builtin entry.
- NaCl-style packages (`tweetnacl`, libsodium bindings, `nacl` in Go) expose
  XSalsa20 (24-byte nonce) through `secretbox` or `crypto_stream`, another
  construction; libsodium's `crypto_stream_salsa20` would fit, but none of its
  bindings is among the members.
- `chacha20`, `aes`, `ctr` and `cbc` are the other tasks of this category;
  ChaCha20-Poly1305 is `authenticated-encryption/chacha20-poly1305-seal`.

See [shared methodology](../../README.md) for timing and reproduction.
