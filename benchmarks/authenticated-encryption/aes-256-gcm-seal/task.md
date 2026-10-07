# AES-256-GCM seal

One operation encrypts one message with AES-256-GCM and returns the ciphertext
followed by the 16-byte authentication tag (the layout every AEAD API produces
or accepts as "combined" output).

An input is an object with four strings: `key` (32 ASCII characters, used as the
32 key bytes), `nonce` (12 ASCII characters, the 96-bit nonce), `aad` (associated
data) and `text` (the message). The strings are turned into bytes once per
fixture, before any timing, in every language, as UTF-8. The measured call is
given the four byte arrays. The 48 cases are JSON-like and log-like messages from 0
to about 8 KB, some with non-ASCII text, each with its own key, nonce and
associated data.

A correct output is exactly the bytes Node's `crypto` module produces for the
same key, nonce, associated data and plaintext. AES-GCM is deterministic for a
fixed key and nonce, so no spelling differences are accepted: the bytes must
be identical. Outputs are compared as hex (JavaScript, Rust, Ruby) or base64
(Go, whose `[]byte` results are marshalled that way); the conversion is done
once per fixture before any timing.

Only sealing is measured; opening is not part of this task. Packages that do not
offer a plain AES-256-GCM seal with a caller-chosen nonce are left out: `@brc-dd/iron`
(JSON sealing with random salt and IV), `@negrel/http-ece` (RFC 8188 with a random
salt) and `@age/age-encryption` (age file format) are not this operation, and
the `chacha20poly1305` crate is a different cipher.

Packages run with their default settings as installed. Each call creates its
cipher or key object from the key bytes, as the packages' documentation shows
for one message; nothing is cached between calls. The Rust crates take
the plaintext as a byte slice and return an owned `Vec<u8>`; ring and aws-lc-rs
encrypt in place, so each call copies the plaintext first and the tag is appended
to that copy.
See [shared methodology](../../README.md) for timing and reproduction.
