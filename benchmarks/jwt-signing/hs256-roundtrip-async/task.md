# HS256 sign and verify round trip, awaited

The asynchronous form of [hs256-roundtrip](../hs256-roundtrip/task.md): the
same claims and the same check, through packages that sign and verify only
through promises, because they use WebCrypto (`crypto.subtle`), which is
asynchronous on Node, Bun and Deno.

One operation takes `{ claims, secret }`: a JSON object of claims and a shared
secret string. It signs the claims with HS256 into a compact JWT
(`header.payload.signature`), awaits that, verifies the token with the same
key, awaits that, and returns `{ claims, token }`: the verified claims as a
plain object and the token it signed.

The 48 cases are the claims of hs256-roundtrip: realistic access-token
payloads (issuer, subject, issued-at and expiry times, roles, nested objects,
Unicode text) of varied size. Every payload carries `iat` and an `exp` far in
the future (year 2100), so the expiry checks pass the same way at any time and
libraries that add `iat` themselves (`@cross/jwt` does by default) have
nothing to add. There is no `aud` claim. The scenario writes the claims out
again rather than importing them, because a scenario is loaded alone beside
each adapter; the two must be kept the same.

The secrets are not those of hs256-roundtrip: every secret here is at least
32 bytes of UTF-8 (32 to 112), where hs256-roundtrip also has 6 and 28. RFC
7518 (section 3.2) requires an HS256 key at least as long as the hash, and
`@cross/jwt` refuses a shorter secret; the fixtures keep to what the
specification allows rather than giving that package an option. The scenario
asserts the length of each secret when it loads.

## What counts as correct

A correct output has claims that deep-equal the input claims (same keys and
values, key order ignored) and a token that the verifier checks on its own,
with `node:crypto` and none of the packages: three base64url parts, a header
whose `alg` is `HS256`, a payload that decodes to the input claims, and a
signature equal to HMAC-SHA256 of `header.payload` under the secret. So an
adapter that returns its input claims without signing fails, and so does a
token signed with another secret or algorithm, an unsigned token, a claim
added or changed, or a decoded-token wrapper returned in place of the claims.
The scenario asserts at load that each of these is refused. What the check
cannot see is whether the returned claims came out of the package's verify
step or were copied from the input; the task requires both steps inside the
measured call, and every adapter does both.

Accepted differences, because they are choices each library makes with default
settings: the JWT header (`{"alg":"HS256","typ":"JWT"}` or without `typ`), key
order and whitespace in the encoded JSON. Tokens are therefore not compared
between packages. Libraries that return a wrapper (`jose`'s `jwtVerify` gives
`{ payload, protectedHeader }`) are mapped to just the claims inside the call.

## What is measured, and what is not

This is an asynchronous task on **one thread** (`load.threads` is 1) with one
operation at a time (`load.concurrency` is 1): the runner awaits each
operation before it starts the next. What is timed is the package's own work
(encoding the header and claims as JSON and base64url, parsing and checking
the token, its claims checks), the two WebCrypto HMAC-SHA256 calls, and the
promise turns the runtime needs to settle them. How a runtime runs
`crypto.subtle` (on the calling thread or handed to a thread pool and back) is
part of the figure; every entry here pays it twice per operation, so the
differences between entries are the packages'. No timer or sleep is involved.

**The key is imported outside the timing, in every entry.** Every package
here accepts a WebCrypto `CryptoKey`, and `@zaubrik/djwt` and `@wok/djwt`
accept nothing else. So each adapter's `prepare` imports the secret once per
fixture with `crypto.subtle.importKey('raw', utf8(secret), { name: 'HMAC',
hash: 'SHA-256' }, false, ['sign', 'verify'])` and the operation is given that
key. `jose` (a `Uint8Array`) and `@cross/jwt` (a string) also take the raw
secret, and then import a key inside each sign and each verify call; that is
the same WebCrypto call in both, so it would add the same two imports to
their figures and none to djwt's. Passing a key keeps the timed work the same
for every entry: one sign and one verify.

Packages run with default settings otherwise. Default verification checks the
signature and the algorithm in every package, and `exp` (and `nbf` where
present) in `jose`, both djwt packages and `@cross/jwt` (whose `validateExp`
is off by default: it checks `exp` only when asked, so here it does not).

## Packages

- `jose` (npm): `await new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).sign(key)`,
  then `(await jwtVerify(token, key)).payload`.
- `@panva/jose` (JSR): the same code as `jose`, from its JSR distribution,
  measured as its own entry as for other packages published on both
  registries.
- `@zaubrik/djwt` (JSR): `await create({ alg: 'HS256', typ: 'JWT' }, claims, key)`,
  then `await verify(token, key)`.
- `@wok/djwt` (JSR): a fork of djwt with the same API, called the same way.
- `@cross/jwt` (JSR): `await signJWT(claims, key)`, then
  `await validateJWT(token, key)`. The algorithm comes from the key. Its
  default `setIat` adds `iat` only when the claims have none, so the claims
  (a prepared input shared by every call) are not changed.

## Left out

- Standard libraries: no runtime's standard library signs or verifies a JWT.
  Writing one from `crypto.subtle.sign` by hand would be our code, not a
  library's, and is not an entry.
- `jsonwebtoken` and `jws`: their callback forms run the same synchronous
  code as in hs256-roundtrip and only defer the callback, so they are measured
  there. Python, Ruby, Go and Rust packages sign synchronously and are
  measured in hs256-roundtrip too.
- Secrets shorter than 32 bytes, as above, and an `aud` claim, as in
  hs256-roundtrip.

See [shared methodology](../../README.md) for timing and reproduction.
