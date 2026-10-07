# AES-256-GCM open

One operation authenticates and decrypts one AES-256-GCM message and returns the
plaintext bytes. This is the reverse of `aes-256-gcm-seal`.

An input is an object with four strings: `key` (32 ASCII characters, used as the
32 key bytes), `nonce` (12 ASCII characters, the 96-bit nonce), `aad` (associated
data) and `sealed` (the ciphertext followed by the 16-byte tag, one character per
byte, code points 0 to 255). The strings are turned into bytes once per fixture,
before any timing, in every language: `sealed` by the latin1 mapping, the others
as UTF-8. The measured call is given the four byte arrays. The 48 cases are JSON-like and log-like messages from 0 to about
8 KB (some with non-ASCII text), each with its own key, nonce and associated data,
sealed with Node's `crypto`. Every tag is valid; the failure path is not measured.

A correct output is exactly the original plaintext bytes (UTF-8 of the message).
Outputs are compared as hex (JavaScript, Rust, Ruby) or base64 (Go, whose `[]byte`
results are marshalled that way); the conversion is done once per fixture before
any timing. An adapter that returns its input or a constant fails.

Only opening is measured. Packages that do not offer a plain AES-256-GCM open
with a caller-chosen nonce are left out: `@brc-dd/iron`, `@negrel/http-ece` and
`@age/age-encryption` use their own formats with random salts, and the
`chacha20poly1305` crate is a different cipher.

Packages run with their default settings as installed. Each call creates its
cipher or key object from the key bytes; nothing is cached between calls. The
Rust crates return an owned `Vec<u8>`; ring and aws-lc-rs decrypt in place, so
each call copies the sealed bytes first and truncates off the tag.
See [shared methodology](../../README.md) for timing and reproduction.
