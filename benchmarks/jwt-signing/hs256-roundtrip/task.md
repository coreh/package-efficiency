# HS256 sign and verify round trip

One operation takes `{ claims, secret }`: a JSON object of claims and a shared
secret string. It signs the claims with HS256 into a compact JWT
(`header.payload.signature`), verifies that token with the same secret, and
returns `{ claims, token }`: the verified claims as a plain object and the
token it signed.

The 48 cases are realistic access-token payloads (issuer, subject,
issued-at and expiry times, roles, nested objects, Unicode text) of varied size,
with secrets of varied length. Every payload carries `iat` and an `exp` far in
the future (year 2100). There is no `aud` claim, because the Rust jsonwebtoken crate rejects any audience unless one is expected, which would need a non-default option, so the expiry check passes the same way at any time and
libraries that add `iat` themselves have nothing to add.

A correct output has claims that deep-equal the input claims (same keys and
values, key order ignored) and a token that the verifier checks on its own,
with `node:crypto` and none of the packages: three base64url parts, a header
whose `alg` is `HS256`, a payload that decodes to the input claims, and a
signature equal to HMAC-SHA256 of `header.payload` under the secret. So an
adapter that returns its input claims without signing fails. What the check
cannot see is whether the returned claims came out of the package's verify
step or were copied from the input; the task rules require both steps inside
the measured call, and every adapter does both.

Accepted differences, because they are choices each library makes with default
settings: the JWT header (`{"alg":"HS256","typ":"JWT"}` or without `typ`), key
order and whitespace in the encoded JSON. Tokens are therefore not compared
between packages. Libraries that return a wrapper (decoded token with header
and claims) are mapped to just the claims inside the call, in every language
alike. Returning the token costs nothing extra in Rust, where the string is
moved out, and one small result object per call in JavaScript; the measured
loop reads only the length of the `sub` claim (JavaScript) or the number of
claims (Rust).

Packages run with default settings as installed, with one exception: the Rust
`jsonwebtoken` crate ships no crypto backend by default and must be built with
one of two, so it is built with `default-features = false` and its `rust_crypto`
feature (pure-Rust HMAC and SHA-2) rather than `aws_lc_rs`. Default verification
checks the signature and the algorithm, and in `jsonwebtoken` (npm and Rust) also
`exp`; `jws` and the Rust `jwt` crate have no claims layer and do not check `exp`. Only synchronous APIs qualify: `jose`
and the JSR packages sign and verify through promises and are left out.
