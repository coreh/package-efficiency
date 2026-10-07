# Ed25519 sign and verify

One operation takes a private key seed (32 bytes), the matching public key
(32 bytes), both as lowercase hex strings, and a UTF-8 message. It decodes the
hex and the message, signs the message with Ed25519 (RFC 8032, pure Ed25519, no
context), verifies the fresh signature against the public key and returns the
64-byte signature. Verification failing is an error. Key generation is not
timed: the 48 key pairs are fixtures.

The 48 messages range from empty to 8 KiB and include ASCII, JSON, log lines and
Unicode text. Ed25519 is deterministic, so a correct output is exactly the
signature node:crypto produces for the same seed and message, asserted byte for
byte.

The signature is returned in whichever form the library produces: a byte array
(JavaScript, Rust), or a byte slice (Go, marshalled to base64 by the harness).
The check accepts the same 64 bytes as a byte array, a hex string or a base64
string. Hex decoding of the fixtures happens inside the measured call in every
language. Packages run with their default settings as installed. Where a
package needs a SHA-512 function supplied (the standalone noble ed25519 build),
the adapter wires in @noble/hashes as that package's documentation shows.

See [shared methodology](../../README.md) for timing and reproduction.
