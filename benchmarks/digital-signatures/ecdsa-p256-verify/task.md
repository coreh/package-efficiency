# ECDSA P-256 verify

One operation takes a public key (65-byte uncompressed SEC1 point, lowercase
hex), a signature (64 bytes, r then s, big-endian, lowercase hex) and a UTF-8
message. It decodes the hex and the message, verifies the signature with ECDSA
over NIST P-256 with SHA-256 (the package hashes the message itself) and returns
a boolean: true for a valid signature, false for an invalid one. A signature that
is well formed but does not verify is a normal `false`, not an error. Key
parsing happens inside the measured call in every language (each fixture has its
own key); there is no key or curve setup to hoist.

This is the verification path only (no signing, no key generation), so it
measures the verifier and its rejection path, unlike the Ed25519 sign-and-verify
task.

The 48 fixtures use 48 different keys and messages from empty to 8 KiB (ASCII,
JSON, log lines, Unicode). Half are valid. The other half are invalid in three
ways, rotating: the message has one character appended, the signature's s has its last
bit flipped (still in range), or the signature is valid for a different key.
Signatures were produced once by node:crypto, normalised to low-s (so libraries
that reject high-s signatures agree with those that do not) and are stored in
the scenario, because ECDSA signing is randomised and would otherwise give
different fixtures in every process. The expected result is known from
construction, and the scenario also checks at load that node:crypto verification
agrees with every expectation. The check asserts every boolean exactly; an
adapter that always returns true or always false fails.

Packages run with their default settings as installed.

See [shared methodology](../../README.md) for timing and reproduction.
