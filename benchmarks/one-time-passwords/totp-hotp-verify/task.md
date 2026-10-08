# HOTP and TOTP at explicit times

One operation takes `{ secret, time, counter, code }` and returns the array
`[hotp, totp, valid]`:

- `secret`: a base32 secret of 20 bytes (32 characters, no padding);
- `hotp`: the 6-digit HOTP code (RFC 4226) for `counter`;
- `totp`: the 6-digit TOTP code (RFC 6238) at the Unix time `time` in seconds;
- `valid`: whether `code` is accepted as a TOTP at `time` with a window of one
  step, that is, the codes of the previous, the current and the next 30-second
  step.

Settings are the usual defaults of all these libraries: HMAC-SHA-1, 6 digits,
30-second period. Codes are strings with leading zeros kept. The secret is
parsed from base32 and the generator object is built inside the call, as a
server would for each login. No clock is read: the time is always given.

There are 48 fixtures, built deterministically. The first ten reuse the secret
`12345678901234567890` of the RFC 4226 and RFC 6238 appendices, including the
ten RFC 4226 counters 0-9 and the six RFC 6238 times (59 to 20000000000). The
rest use pseudo-random secrets, times (some on the first or last second of a
step), counters (below 2^31, so that 32-bit signed arithmetic is enough) and candidates that are in the window (steps
-1, 0, +1), just outside it (-2, +2, +3) or wrong.

The expected values come from a short HMAC-SHA-1 implementation on
`node:crypto` in the scenario, which is first checked against the published RFC
vectors. The check is exact: both codes must match as strings, and `valid` must
be a boolean equal to the expected one, so a library that ignores the window,
widens it, or truncates differently fails.

Accepted as equivalent: how the library names its window (`window`,
`valid_window`, drift, skew, epoch tolerance), and whether it reports a
verification as a boolean or as a delta/option, which the adapter maps to a
boolean inside the call. No standard library has HOTP/TOTP, so there are no
builtin entries; hand-written HMAC would not compare libraries. Provisioning
URIs, QR codes, secret generation, HMAC-SHA-256/512 and 8-digit codes are
outside this task.
