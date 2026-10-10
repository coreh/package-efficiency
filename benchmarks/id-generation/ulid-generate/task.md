# Generate ULIDs

One operation generates 100 ULIDs and returns them as a list of 26-character
strings in Crockford's base32 (`01JQ4V7M0X3TBDSZ7XRADM79XE`). The fixture
input is only the count, 100, the same in all 16 fixtures: generating an ID
takes no other input. Packages run with their default generator, reading the
current time and drawing the random part from their default source for every
ID. A batch rather than one ID per call keeps the harness's own cost per call
small beside the work, and lets the check look at the random bits across a
batch.

## What counts as correct

The ULID specification fixes the first 10 characters (a 48-bit Unix time in
milliseconds) and leaves the last 16 (80 bits) to the generator: all random,
or, in its monotonic mode, the previous value plus a random increment when
the millisecond has not changed. Each package fills them its own way, so there
is no output to compare with, and the verifier checks the properties that
make a batch correct (pattern 5):

- 100 strings of 26 characters from Crockford's alphabet
  (`0123456789ABCDEFGHJKMNPQRSTVWXYZ`, no I, L, O or U), the first one 0 to 7,
  since 26 characters hold 130 bits and a ULID has 128. Case is accepted
  either way, as the specification decodes case-insensitively; a hyphen,
  a 27th character or a UUID is not.
- The 48-bit timestamp lies within the time of the call: no earlier than when
  the scenario was loaded, which is before any adapter starts, and no later
  than when the outputs are verified, with one second of slack on each side
  for clock reads in other processes. A fixed timestamp, seconds or
  microseconds instead of milliseconds fails.
- The lowest 32 bits are random. A fresh draw per ID keeps them random, and so
  does a monotonic generator, whose increment within a millisecond is itself
  a random number below 2^32 (`oklog/ulid`); the higher random bits of such a
  generator stay put within a millisecond, so they are not checked. Across a
  batch each of those 32 bits must be 0 in some ID and 1 in another; a random
  batch fails this with probability 2^-99 per bit. A constant, a counter that
  adds 1 or a value derived from the time fails.
- All 1,600 IDs of the 16 calls are distinct.

Not required: that IDs are in increasing order within a millisecond. The
specification makes that the monotonic mode, and the packages' default calls
differ: one increments, two draw everything afresh. Randomness quality is not
tested beyond the checks above.

The scenario checks itself when it loads: a batch it builds from the clock and
random bytes passes, in upper and lower case, as does a monotonic batch with
random increments, and these fail: a fixed 2024 timestamp, a timestamp in
seconds, one in microseconds, a first character above 7, the letters I and U,
a counter in the low bits, one ID repeated, 99 IDs, 27 characters, a hyphen,
UUIDs, and the same batch returned by two calls.

## Packages

- `@std/ulid` (JSR): `ulid()` with no argument (the current time), 100 times.
  Its random part is 16 bytes from `crypto.getRandomValues`, one character
  per byte.
- `@yi/ulid` (JSR): `generateULID()`, 100 times. Its random part is 16 calls
  of `Math.random()`, which is not a secure source; there is no option for
  another, so it is measured with its only generator.
- `github.com/oklog/ulid/v2` (Go): `ulid.Make().String()`, 100 times. `Make`
  uses the package's default entropy: a `math/rand` stream seeded from the
  clock at start-up, monotonic within a millisecond, behind a lock. It is not
  a secure source either; the package's documentation says so and offers
  `ulid.New` with `crypto/rand` for that, which is not the default call.

Every entry returns a string per ID, so the base32 encoding is timed in every
language, as is building the list of 100. The random sources differ, and this
is reported rather than hidden: each is the package's default, and a secure
source costs more per ID than `Math.random` or `math/rand`.

The standard libraries of JavaScript, Python, Ruby and Go have no ULID
function, so there are no built-in entries.

## Left out

- The monotonic generators (`monotonicUlid` of `@std/ulid`, `ulid.Monotonic`
  used with `ulid.New` in `oklog/ulid`) beyond what a default call does: they
  are a variant of the job, not the default call.
- `ulid`, `ulidx` (npm), `python-ulid` (PyPI) and the `ulid` crate are not in
  the catalog yet; they would join with the same check.

See [shared methodology](../../README.md) for timing and reproduction.
