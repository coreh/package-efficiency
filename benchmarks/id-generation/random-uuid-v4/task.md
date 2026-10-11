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

Each entry uses its package's UUID v4 function: the `uuid` package and the
platform's `crypto.randomUUID()` in JavaScript; the `uuid` crate
(`Uuid::new_v4().to_string()`) in Rust; `uuid.uuid4()`, `fastuuid` and
`uuid-utils`, each converted with `str()`, in Python; `SecureRandom.uuid` (the
bundled one and the pinned gem) and `uuidtools` in Ruby; `google/uuid`,
`gofrs/uuid`, `satori/go.uuid`, `pborman/uuid` and `marstr/guid` in Go, which
has no UUID in its standard library. All return a string per call, so the
string formatting is timed in every language.

See [shared methodology](../../README.md) for timing and reproduction.
