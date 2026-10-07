# Sort semantic versions

One operation takes an array of 12 to 90 version strings in scrambled order and
returns the same strings in ascending semantic-version precedence order, as an
array of the original strings. Every version is parsed by the package under test
inside the measured call, and the comparison is the package's own.

The 48 lists hold realistic releases: `major.minor.patch` with numeric parts
that need numeric rather than text comparison (`1.10.0` after `1.9.0`), and
prerelease tags such as `-alpha`, `-alpha.1`, `-beta.2`, `-beta.11`, `-rc.1`,
which sort below their release and by identifier rules among themselves
(numeric identifiers below alphanumeric ones, shorter lists first). Some
versions carry build metadata (`+build.5`), which is ignored in precedence.
Inside a list no two versions have equal precedence, so the order is unique
and the stable or unstable nature of a sort does not matter.

Each adapter parses every string once, sorts the parsed versions with the
package's comparison, and returns the original input strings in that order
(JavaScript adapters return the input strings, Rust returns indices into the
input that the harness resolves to strings outside the timing). The adapter does
not format versions back to text. The verifier compares to an independent
implementation of the precedence rules in `scenario.mjs`, so returning the input
unchanged or a plain string sort fails.

Packages run with default options as installed. `@utility/version` and
`@codemonument/zod-semver` (a validator only) and `semver-parser` (no
comparison) are left out: they do not offer parse-then-compare as a ready API.
