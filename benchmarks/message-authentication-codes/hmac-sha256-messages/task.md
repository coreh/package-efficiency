# HMAC-SHA-256 over messages

One operation computes the HMAC-SHA-256 tag (RFC 2104) of a message under a key
and returns the 32 raw tag bytes.

An input is an object with two ASCII strings: `key` (16, 32, 64 or 100
characters, used as the key bytes; the 100-character keys are longer than the
64-byte SHA-256 block and so are hashed first) and `text` (the message). The 48
cases are log-like and JSON-like messages of 16 bytes to 16 KB, each with its
own key. 38 of them are under 4 KB (the median is 1,000 bytes), but every
fixture is called equally often, so by bytes the mix leans to the long ones:
the 38 short messages are about a quarter of the roughly 124,000 bytes hashed
in one pass, and the six of 8 KB and more are a little over half (the largest
alone is 13%). The figure is therefore a blend of per-call key setup and
SHA-256 throughput, not either alone. Text is
ASCII so every language turns it into the same bytes; the conversion from
string to bytes happens inside the call, as the packages' documentation shows.

A correct output is exactly the bytes Node's `crypto.createHmac('sha256', ...)`
produces for the same key and message. HMAC is deterministic, so the bytes must be
identical. Outputs are compared as hex (JavaScript, Rust, Ruby, Python) or as
the numbers of a fixed-size byte array (Go); that conversion happens once per
fixture before any timing, and the verifier fails a wrong tag, a tag for the
wrong key and any constant output.

The key is set up inside each call (inner and outer pad blocks), in every
adapter alike: the plain documented one-message usage of each API. No keyed state
is reused between calls and no result is cached.

Only the HMAC construction over SHA-256 is compared. The other crates in the
category are different algorithms with different tags: `poly1305`, `ghash`
and `polyval` are one-time universal hashes with 16-byte tags and a different
key shape, so they cannot be run through the same task. The `hmac` crate is
generic over a hash; it is paired with `sha2` (`Hmac<Sha256>`), which is
needed for it to do anything. No npm or JSR package in this category is
listed, so JavaScript has only the runtime's own `node:crypto` (also in Bun and
Deno).
