# Time-ordered UUID v7

One operation generates 100 version 7 UUIDs and returns them as a list of
strings in the canonical 36-character form
(`xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx`). The fixture input is only the count,
100, the same in all 16 fixtures: generating an ID takes no other input.
Packages run with their default settings, reading the current time and their
secure random source for every ID. A batch rather than one ID per call keeps
the harness's own cost per call small beside the work, and lets the check look
at the random bits across a batch.

## What counts as correct

RFC 9562 fixes the first 48 bits (Unix time in milliseconds), the version and
the variant, and leaves the other 74 bits to the generator: all random, a
counter that keeps IDs in order within a millisecond, or extra sub-millisecond
time. Each package fills them its own way, so there is no output to compare
with, and the verifier checks the properties that make a batch correct
(pattern 5):

- 100 strings, each matching the canonical form with version nibble 7 and
  variant nibble 8, 9, a or b. Case is accepted either way, as the RFC allows;
  braces, a missing hyphen or a URN prefix are not.
- The 48-bit timestamp lies within the time of the call: no earlier than when
  the scenario was loaded, which is before any adapter starts, and no later
  than when the outputs are verified, with one second of slack on each side
  for clock reads in other processes and for generators that move their
  timestamp forward when a counter runs over. A fixed timestamp, seconds
  instead of milliseconds, or the pre-RFC draft layout (36 bits of seconds and
  a binary fraction, which read as milliseconds is about 4 times the present)
  fails.
- The lowest 32 bits are random. Every layout the RFC allows keeps them random
  (a counter sits in the 12 bits after the version and the top of the variant
  field, never at the bottom), so across a batch each of those 32 bits must be
  0 in some ID and 1 in another; a random batch fails this with probability
  2^-99 per bit. A constant, a counter or a value derived from the time fails.
- All 1,600 IDs of the 16 calls are distinct.

Not required: that IDs are in increasing order within a millisecond. The RFC
makes that optional (section 6.2) and the packages differ: some keep a
counter, some fill everything with random bits. Randomness quality is not
tested beyond the checks above.

The scenario checks itself when it loads: a batch it builds from the clock and
random bytes passes, in lower and upper case, and these fail: version 4, a
fixed 2024 timestamp, a timestamp in seconds, the draft layout, the wrong
variant, a counter in the low bits, one ID repeated, 99 IDs, no hyphens,
braces, and the same batch returned by two calls.

## Packages

- `uuid` (npm): `v7()`, 100 times.
- `@quentinadam/uuidv7` (JSR): `generateUUIDv7()` with no argument (the
  current time), 100 times.
- `uuid` (Rust crate, with its `v7` feature): `Uuid::now_v7().to_string()`,
  100 times.
- `uuid-utils` (PyPI): `str(uuid_utils.uuid7())`, 100 times.
- `github.com/google/uuid` (Go): `uuid.NewV7()`, then `String()`, 100 times.
- `github.com/gofrs/uuid` (Go): `uuid.NewV7()`, then `String()`, 100 times.
- Standard library: Python `str(uuid.uuid7())` (new in 3.14, so CPython only;
  PyPy has no `uuid7`); Ruby `SecureRandom.uuid_v7`; Bun `Bun.randomUUIDv7()`.
  Node, Deno and Go have no UUID v7 in their standard libraries.

Every entry returns a string per ID, so turning the 16 bytes into text is
timed in every language, as is building the list of 100.

## Left out

- `uuid7` (PyPI, `uuid_extensions.uuid7()`): its only release, 0.1.0 of
  2021, implements an earlier draft of version 7, before RFC 9562: the first
  36 bits are whole seconds and the next 24 a binary fraction of a second.
  Read as RFC 9562 milliseconds that is about 4.1 times the present time, so
  it would fail the timestamp check; it is a different format, not this job.

See [shared methodology](../../README.md) for timing and reproduction.
