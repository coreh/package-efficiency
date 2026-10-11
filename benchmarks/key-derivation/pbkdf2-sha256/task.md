# PBKDF2-HMAC-SHA-256 key derivation

One operation derives a key from a password and a salt with PBKDF2 using
HMAC-SHA-256 and returns the raw key bytes. An input is an object
`{ password, salt, iterations, length }`: the password and salt are text
strings (ASCII, accented, CJK and emoji text, passphrases, hex-like salts, from
0 to about 100 characters; some passwords are empty), `iterations` is always
10,000 and `length` is 16, 32 or 64 bytes (a length of 64 needs two blocks of
output). There are 36 fixtures, built deterministically.

A correct output is exactly the `length` bytes of PBKDF2-HMAC-SHA-256 over the
UTF-8 bytes of the password and salt. The expected values come from
`node:crypto`'s `pbkdf2Sync`, which is also one of the entries
(`builtin/node-crypto`), so the reference is anchored by a published
known-answer vector (RFC 7914 style: password `password`, salt `salt`, 1
iteration, 20 bytes) and the check is exact. Outputs for different fixtures
differ, so a constant or an echo of the input fails.

Accepted as equivalent: the container type of the bytes (`Uint8Array`,
`Buffer`, Rust `[u8; N]`/`Vec<u8>`, Python `bytes`, Ruby binary string, Go
`[]byte`). Nothing is converted to hex just to match. Python and Ruby define
`describe`, and Rust a `describe` function, only to turn the bytes into a list
of integers for the verifier, outside the timed call.

Every adapter is given the password and salt as strings and does any UTF-8
encoding inside the call: `@noble/hashes` accepts strings directly, Python
encodes them, and Rust and Go take the strings' bytes. The Rust crate is used
with its `sha2` companion, `pbkdf2_hmac::<Sha256>`, filling a 64-byte stack
buffer whose first `length` bytes are the key. No setup is
hoisted: PBKDF2 has no reusable state per password and salt.

Every package runs with default settings as installed. No result is cached.
HKDF, bcrypt, scrypt, Argon2 and other iteration counts are out of scope. At
10,000 iterations one call costs milliseconds, so this task is dominated by
the speed of the HMAC-SHA-256 compression loop.
