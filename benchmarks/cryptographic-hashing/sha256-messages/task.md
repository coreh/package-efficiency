# SHA-256 of in-memory messages

One operation computes the SHA-256 digest of one string and returns the 32 raw
digest bytes. Inputs are text messages encoded as UTF-8: empty, one character,
lengths around the 55/56/63/64/65-byte block boundaries, log lines, JSON
documents, accented and CJK text, emoji, and larger messages up to 16 KB. There
are 48 fixtures, built deterministically.

A correct output is exactly the 32 bytes of SHA-256 over the UTF-8 bytes of the
input. The expected values come from `node:crypto`'s SHA-256, which is also one
of the entries (`builtin/node-crypto`), so that entry is checked against the
same function it calls and the reference is not independent of it. To anchor the
reference itself, the scenario first checks it against two published
known-answer vectors, the digests of the empty string and of `abc`. The check is
exact; there is no tolerance.

Accepted as equivalent: the container type of the 32 bytes (`Uint8Array`,
`Buffer`, `ArrayBuffer`, Rust `[u8; 32]`/array types, Python `bytes`, Ruby
binary string, Go `[32]byte`). Each library returns its own type and nothing is
converted to hex or copied just to match another language; Python and Ruby
define `describe` and Rust a `describe` function only to turn the bytes into a
list of integers for the verifier, outside the timed call.

The JavaScript packages take bytes, so those adapters encode the text to UTF-8
inside the call with `TextEncoder`; `node:crypto` takes the string directly. Rust, Python, Ruby and Go strings
are already UTF-8 bytes, so no encoding step is needed there.

Every package runs with default settings as installed, in its plain one-shot
form. No result is cached. Streaming, HMAC, other algorithms and hashing very
large buffers are outside this task: it measures the per-call cost on small and
medium messages.
