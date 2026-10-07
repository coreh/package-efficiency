# AES-256-CTR encrypt

One operation encrypts one message with AES-256 in CTR mode and returns the
ciphertext, which has the length of the message. There is no authentication tag.

An input is an object with three strings: `key` (32 ASCII characters, used as the
32 key bytes), `iv` (16 ASCII characters, the initial 128-bit counter block,
incremented as a 128-bit big-endian integer, as OpenSSL does) and `text` (the
message). The strings are turned into bytes once per fixture, before any
timing, in every language, as UTF-8. The measured call is given the three byte
arrays. The 48 cases are JSON-like and log-like messages from 0 to about 8 KB,
some with non-ASCII text, each with its own key and IV.

A correct output is exactly the bytes Node's `crypto` module produces for the
same key, IV and plaintext. Node's `crypto` is also one of the entries, so the
scenario first checks it against a published known answer (the first block of
the CTR-AES256 encryption example in NIST SP 800-38A, F.5.5); the Go, Rust and
Ruby entries, which are independent implementations, must then agree with it on
every fixture. CTR is deterministic, so no differences are accepted:
the bytes must be identical, and the verifier also checks that the output differs
from the input and has the same length. Outputs are compared as hex (JavaScript,
Rust, Ruby) or base64 (Go, whose `[]byte` results marshal that way); the conversion
is done once per fixture before any timing.

Only encryption is measured (CTR decryption is the same operation). Each call
builds its cipher object from the key and IV, as the packages' documentation shows
for one message with its own IV; nothing is cached between calls. For the
short messages (10 of the 48 are under 100 bytes) creating that object, not
encrypting, is most of the cost, most of all in Node and Ruby, where it is an
OpenSSL cipher context; that is the cost of encrypting one message. Packages that
do not offer a plain AES-256-CTR with a caller-chosen IV are left out. `@roj/tgcrypto` (the only JSR package in the category) offers only AES-IGE, not CTR, so it is left out. The
`aes` crate alone is only a block cipher, so the Rust entry is `ctr` (with `aes`
as its block cipher); `chacha20`, `salsa20` and `cbc` are different ciphers or modes.
Node and Ruby return a new buffer from `update`, and Go writes the keystream
output into a new slice. The Rust crate encrypts in place, so each call copies
the plaintext first and returns that copy as an owned `Vec<u8>`.
See [shared methodology](../../README.md) for timing and reproduction.
