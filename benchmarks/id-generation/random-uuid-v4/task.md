# Random UUID v4

One operation generates one random version 4 UUID and returns it as a string in
the canonical 36-character form (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`). The
fixture input is only a call index (0 to 63); it is ignored, because generating
an ID takes no input. Packages run with their default settings as installed,
using their secure (cryptographically strong) random source.

A correct output is a string that matches the RFC 9562 version 4 layout:
version nibble 4, variant nibble 8, 9, a or b, hex digits. Case is accepted
either way, since the RFC allows uppercase input, though every package here
emits lowercase. The check generates 64 IDs per package and requires all of
them to be distinct, so a constant or counter-like implementation fails the
format or the uniqueness test. Randomness quality is not tested beyond that.

Out of scope: nanoid, ULID, UUID v7 and other formats. They have different
lengths, alphabets and entropy, so the work per call is not the same job.
Hashing of content and sequential counters are not ID generation here.

Each language uses its own UUID v4 function: the `uuid` package
and the platform's `crypto.randomUUID()` in JavaScript; the `uuid` crate
(`Uuid::new_v4().to_string()`) in Rust; `uuid.uuid4()` converted with `str()` in
Python; `SecureRandom.uuid` in Ruby. All return a string per call, so the
string formatting is timed in every language. Go has no UUID in its standard
library and is not included.
See [shared methodology](../../README.md) for timing and reproduction.
