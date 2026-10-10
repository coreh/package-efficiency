# ChaCha20-Poly1305 seal

One operation encrypts one message with ChaCha20-Poly1305 (RFC 8439: a 256-bit
key, a 96-bit nonce, the keystream starting at block counter 1, and a Poly1305
tag over the associated data and the ciphertext) and returns the ciphertext
followed by the 16-byte authentication tag (the layout every AEAD API produces
or accepts as "combined" output). It is the AEAD of TLS 1.3, WireGuard and SSH
on machines without AES instructions.

An input is an object with four strings: `key` (32 ASCII characters, used as the
32 key bytes), `nonce` (12 ASCII characters, the 96-bit nonce), `aad` (associated
data) and `text` (the message). The strings are turned into bytes once per
fixture, before any timing, in every language, as UTF-8. The measured call is
given the four byte arrays. The 48 cases are the inputs of `aes-256-gcm-seal`,
byte for byte: JSON-like and log-like messages from 0 to about 8 KB (lengths
around the 16-byte Poly1305 block and the 64-byte ChaCha20 block, some with
non-ASCII text), each with its own key, nonce and associated data. The two
tasks can be read side by side.

## What counts as correct

A correct output is exactly the bytes of the scenario's own reference: a short
ChaCha20-Poly1305 written out from RFC 8439 (the ChaCha20 block function of
section 2.3, Poly1305 of section 2.5 with BigInt arithmetic modulo 2^130 - 5,
and the AEAD construction of section 2.8). It uses no cipher from
`node:crypto`, so the scenario loads on every runtime, Bun included, whose
`node:crypto` has no ChaCha20. When the scenario loads it checks the reference
against the RFC's vectors: ChaCha20 of section 2.4.2, Poly1305 of section
2.5.2, and the AEAD test vector of section 2.8.2 (the start of the ciphertext
and the whole tag, which covers every ciphertext byte). The reference gives
the same bytes as Node's `crypto` module for all 48 fixtures.
ChaCha20-Poly1305 is deterministic for a fixed key and nonce, so no spelling
differences are accepted: the bytes must be identical. Outputs are compared as
hex (JavaScript, Rust, Python, Ruby) or base64 (Go, whose `[]byte` results are
marshalled that way); the conversion is done once per fixture before any timing.

When the scenario loads it proves that the check refuses wrong outputs: the tag
with one bit flipped, the ciphertext without its tag, the tag before the
ciphertext, the output sealed without the associated data, the keystream
started at block counter 0 instead of 1 (with the right tag), AES-256-GCM of
the same input, the plaintext itself, another fixture's output, and the bytes
as a list of numbers.

Only sealing is measured; opening is not part of this task. XChaCha20-Poly1305
(24-byte nonce), the original 64-bit-nonce construction, streaming over chunks
and tags shorter than 16 bytes are outside it.

Packages run with their default settings and features as installed. Each call
creates its cipher or key object from the key bytes, as the packages'
documentation shows for one message; nothing is cached between calls. The Rust
crates take the plaintext as a byte slice and return an owned `Vec<u8>`; ring
and aws-lc-rs encrypt in place, so each call copies the plaintext first and the
tag is appended to that copy.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/node-crypto` | `createCipheriv('chacha20-poly1305', key, nonce, { authTagLength: 16 })`, `setAAD`, `update`, `final`, `getAuthTag`, joined with `Buffer.concat` (Node and Deno) |
| `builtin/ruby-openssl` | `OpenSSL::Cipher.new('chacha20-poly1305').encrypt` with `key`, `iv`, `auth_data`, then `update + final + auth_tag` |
| JSR `@noble/ciphers` | `chacha20poly1305(key, nonce, aad).encrypt(text)` from `@noble/ciphers/chacha.js` |
| PyPI `pycryptodome` | `ChaCha20_Poly1305.new(key=key, nonce=nonce)`, `update(aad)`, `encrypt_and_digest(text)`, ciphertext and tag joined |
| cargo `chacha20poly1305` | `ChaCha20Poly1305::new(key).encrypt(nonce, Payload { msg, aad })` (RustCrypto, default features) |
| cargo `ring` | `LessSafeKey::new(UnboundKey::new(&CHACHA20_POLY1305, key))`, `seal_in_place_append_tag` on a copy of the plaintext |
| cargo `aws-lc-rs` | the same calls with `aws_lc_rs::aead::CHACHA20_POLY1305` |
| Go `golang.org/x/crypto` | `chacha20poly1305.New(key)`, then `Seal(nil, nonce, text, aad)` |

The package entries are written separately; this list says what each is to
call.

## Left out

- Bun: its `node:crypto` has no `chacha20-poly1305` cipher (`Unknown cipher`),
  so the `node:crypto` entry runs on Node and Deno only. The other JavaScript
  entries run on Bun too, since the scenario's reference needs no cipher.
- Go and Python have no ChaCha20-Poly1305 in their standard libraries; Go's is
  in `golang.org/x/crypto`, which is listed above as a module, and Python's
  `hashlib` and `hmac` have no ciphers.
- `@brc-dd/iron`, `@negrel/http-ece` and `@age/age-encryption` use their own
  formats with random salts or nonces, as in `aes-256-gcm-seal`; they are not
  this operation.

See [shared methodology](../../README.md) for timing and reproduction.
