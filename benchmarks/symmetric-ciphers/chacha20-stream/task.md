# ChaCha20 encrypt (RFC 8439)

One operation encrypts one message with the ChaCha20 stream cipher of RFC 8439
(a 256-bit key, a 96-bit nonce and a 32-bit block counter that starts at 0)
and returns the ciphertext, which has the length of the message. There is no
authentication tag. Bare ChaCha20 is the keystream inside ChaCha20-Poly1305
and the cipher of formats that authenticate separately or not at all (random
number generators, disk and stream encryption, protocols with their own MAC).

An input is an object with three strings: `key` (32 ASCII characters, used as
the 32 key bytes), `nonce` (12 ASCII characters, the 96-bit nonce) and `text`
(the message). The strings are turned into bytes once per fixture, before any
timing, in every language, as UTF-8. The measured call is given the byte
arrays. The 48 cases are the messages, keys and nonces of
`authenticated-encryption/chacha20-poly1305-seal`, byte for byte: JSON-like and
log-like messages from 0 to about 8 KB (lengths around the 64-byte ChaCha20
block, some with non-ASCII text), each with its own key and nonce. The two
tasks can be read side by side.

## The block counter

Every entry starts the keystream at block counter 0, the default of every
package listed here. Libraries that wrap OpenSSL (Node's and Ruby's) take a
16-byte IV instead of a nonce: OpenSSL's layout is the 32-bit counter,
little-endian, followed by the 12-byte nonce. Those adapters build that IV
(four zero bytes, then the nonce) in `prepare`, before timing, so the measured
call is given the same information as every other entry. ChaCha20-Poly1305
starts its keystream at counter 1; that is not this operation, and the check
refuses it.

## What counts as correct

A correct output is exactly the bytes of the scenario's own reference: a short
ChaCha20 written out from RFC 8439, section 2.3 (block counter 0 in state word
12, the 96-bit nonce in words 13 to 15). It uses no cipher from `node:crypto`,
so the scenario loads on every runtime, Bun included, whose `node:crypto` has
no ChaCha20. When the scenario loads it checks the reference against two
vectors of RFC 8439: test vector #1 of appendix A.2 (zero key and nonce,
counter 0, 64 zero bytes, the whole ciphertext) and the example of section
2.4.2 (counter 1, the first 32 bytes), which together fix the cipher, the
counter and where the nonce goes. The reference gives the same bytes as Node's
`crypto` module for all 48 fixtures. ChaCha20 is deterministic for a fixed key, nonce and counter, so
no differences are accepted: the bytes must be identical, which also fixes the
length. Outputs are compared as hex (JavaScript, Rust, Python, Ruby) or base64
(Go, whose `[]byte` results are marshalled that way); the conversion is done
once per fixture before any timing.

When the scenario loads it proves that the check refuses wrong outputs: the
last byte flipped, the keystream started at counter 1 instead of 0, the nonce
with its bytes reversed, the ciphertext one byte short, the ChaCha20-Poly1305
output (ciphertext and tag) of the same input, AES-256-CTR of the same input,
the plaintext itself, another fixture's output, and the bytes as a list of
numbers. The ChaCha20-Poly1305 output for that proof also comes from the
scenario's own code (Poly1305 and the AEAD of RFC 8439, sections 2.5 and 2.8,
anchored by the vectors of sections 2.5.2 and 2.8.2); AES-256-CTR comes from
`node:crypto`, which every runtime has.

Only encryption is measured (decryption is the same operation). XChaCha20
(24-byte nonce), the original construction with a 64-bit nonce and a 64-bit
counter, reduced-round variants (ChaCha8, ChaCha12) and seeking to another
counter are outside this task.

Packages run with their default settings and features as installed. Each call
creates its cipher object from the key and nonce, as the packages'
documentation shows for one message with its own nonce; nothing is cached
between calls. For the short messages (10 of the 48 are under 100 bytes)
creating that object, not encrypting, is most of the cost, most of all in Node
and Ruby, where it is an OpenSSL cipher context; that is the cost of
encrypting one message. Node and Ruby return a new buffer from `update`. The
RustCrypto crate encrypts in place or buffer to buffer, so each call writes
the keystream applied to the plaintext into a new `Vec<u8>` and returns it.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/node-crypto` | `createCipheriv('chacha20', key, iv)` with the 16-byte IV (counter 0 then nonce, built in `prepare`), `update`, `final`, joined with `Buffer.concat` (Node and Deno) |
| `builtin/ruby-openssl` | `OpenSSL::Cipher.new('chacha20').encrypt` with `key` and the same 16-byte `iv`, then `update + final` |
| JSR `@noble/ciphers` | `chacha20(key, nonce, text)` from `@noble/ciphers/chacha.js` (counter 0 by default) |
| PyPI `pycryptodome` | `ChaCha20.new(key=key, nonce=nonce).encrypt(text)` from `Crypto.Cipher` (a 12-byte nonce selects RFC 8439; counter 0) |
| cargo `chacha20` | `ChaCha20::new(key, nonce)` (RustCrypto, `KeyIvInit`), then the keystream applied from the plaintext into a new `Vec<u8>` (`apply_keystream_b2b`, or a copy and `apply_keystream`) |
| Go `golang.org/x/crypto` | `chacha20.NewUnauthenticatedCipher(key, nonce)`, then `XORKeyStream` into a new slice |

The package entries are written separately; this list says what each is to
call.

## Left out

- Bun: its `node:crypto` has no `chacha20` cipher (`Unknown cipher`), so the
  `node:crypto` entry runs on Node and Deno only.
  The other JavaScript entries run on Bun too, since the scenario's reference
  needs no cipher.
- Go and Python have no ChaCha20 in their standard libraries; Go's is in
  `golang.org/x/crypto/chacha20`, listed above as a module, and Python's
  `hashlib` and `hmac` have no ciphers.
- `chacha20poly1305`, `ring`'s and `aws-lc-rs`'s AEADs are ChaCha20-Poly1305,
  the task `authenticated-encryption/chacha20-poly1305-seal`. `salsa20` is
  another cipher; `aes`, `ctr` and `cbc` are AES.

See [shared methodology](../../README.md) for timing and reproduction.
