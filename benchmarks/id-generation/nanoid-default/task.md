# Default 21-character URL-safe ID

One operation generates one random Nano ID with the package's default settings
and returns it as a string. The fixture input is only a call index (0 to 63),
which is ignored. Packages run with their default settings as installed, using
their default secure random source; no length or alphabet is passed.

A correct output is a string of exactly 21 characters, all from the 64-character
URL-safe alphabet `A-Za-z0-9_-`. The check generates 64 IDs per package, and
requires all of them to be distinct and the whole set to use at least 40
different characters, so a constant, counter-like or low-variety generator
fails. Randomness quality is not tested beyond that.

Out of scope: UUIDs, ULIDs and other formats with different lengths and
alphabets, custom alphabets and sizes, and non-secure generators.

JavaScript uses `nanoid()` from the `nanoid` package and from `@sitnik/nanoid`
(JSR). Rust uses the `nanoid` crate's `nanoid!()` macro, whose default is the
same 21-character alphabet. All return a string per call. The entropy
handling differs and both are library defaults: npm `nanoid` fills a pool
of random bytes and slices it across calls; `@sitnik/nanoid` on JSR ships the
browser build, which calls `crypto.getRandomValues` for 21 bytes on every
call; the Rust crate seeds a new `StdRng` from the operating system on every
call. The standard
libraries of JavaScript, Python, Ruby and Go have no Nano ID function, so no
built-in adapters are included.
See [shared methodology](../../README.md) for timing and reproduction.
