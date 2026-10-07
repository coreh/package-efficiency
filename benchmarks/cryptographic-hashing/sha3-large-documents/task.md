# SHA3-256 of large in-memory documents

One operation computes the SHA3-256 digest (FIPS 202) of one large string and
returns the 32 raw digest bytes. Inputs are text documents encoded as UTF-8,
from 32 KB to 1 MB: log files, JSON arrays, mixed-language prose with accented
and CJK text and emoji, and CSV-like tables. There are 36 fixtures, built
deterministically. Where the sibling task `sha256-messages` measures per-call
cost on small messages with SHA-256, this one measures bulk throughput of a
different algorithm (the Keccak sponge) on large inputs, where per-call setup
is negligible.

A correct output is exactly the 32 bytes of SHA3-256 over the UTF-8 bytes of
the input. Expected values come from `node:crypto`'s `sha3-256`, which is also
an entry (`builtin/node-crypto`), so the reference is anchored by the published
known-answer vectors for the empty string and `abc`, checked first by the
scenario. The check is exact. Note this is SHA3-256, not legacy Keccak-256
(different padding), so a package returning Keccak-256 fails.

Accepted as equivalent: the container type of the 32 bytes (`Uint8Array`,
`Buffer`, `ArrayBuffer`, Rust array types, Python `bytes`, Go `[32]byte`).
Nothing is converted to hex or copied to match another language; Python and
Rust define `describe` only to turn the bytes into integers for the verifier,
outside the timed call.

The JavaScript packages that take bytes encode the string to UTF-8 inside the
call with `TextEncoder`; `node:crypto` takes the string directly. Rust, Python
and Go strings are already UTF-8 bytes. Ruby is not included because its
standard library on the pinned runtime has no SHA3.

Every package runs with default settings as installed, in its plain one-shot
form. No result is cached. Streaming, HMAC, other algorithms and small messages
are outside this task.
