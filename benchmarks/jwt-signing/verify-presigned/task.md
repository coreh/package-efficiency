# Verify pre-signed HS256 tokens, valid and rejected

One operation takes `{ token, secret }`: a compact JWT that was signed
beforehand (by `node:crypto`, outside any package) and the shared secret to
check it with. The operation verifies the token with HS256 and returns
`{ status, claims }`. `status` is `valid` (claims are the verified payload as a
plain object), `expired` (signature correct, `exp` in the past) or
`invalid-signature` (claims are `null`).

This is a different job from the sign-and-verify round trip: nothing is signed
in the measured call, and 30% of the tokens are rejected, so the error path
counts. The 60 cases repeat a pattern of ten: seven valid tokens, one whose
payload was altered after signing, one signed with a different secret, and one
correctly signed token whose `exp` is in 2022. Payloads are realistic access
tokens (issuer, subject, times, roles, nested objects, Unicode text) of varied
size; secrets vary in length. Valid tokens have `exp` in year 2100 and no `aud`
claim, so default validation passes at any time.

A correct output has the expected status for every fixture and, for valid ones,
claims that deep-equal the payload that was signed. Returning the decoded
payload without checking the signature fails on the tampered and wrong-secret
tokens; a constant fails on the mix.

Libraries signal rejection differently: `jsonwebtoken` for npm throws, the Rust
crate returns an error with a kind. Each adapter maps the rejection to the
status inside the measured call, in the same way: an expiry error becomes
`expired`, any other error `invalid-signature`. Creating and catching the
exception is part of what the JavaScript package costs. Packages run with
default settings as installed, except that the Rust `jsonwebtoken` crate ships
no crypto backend by default and is built with `default-features = false` and
`rust_crypto` (pure-Rust HMAC and SHA-2).

There is one entry per language: `jsonwebtoken` for npm and the `jsonwebtoken`
crate for Rust. The task therefore compares a JavaScript library with a Rust
crate plus its crypto backend; it does not grade a package against a peer in
the same language. The sibling sign-and-verify task has more entries.

Left out: `jws`, `jwa` and the Rust `jwt` crate have no claims layer and do not
check `exp`, so they could not give the `expired` outcome without the adapter
doing that check itself. `jose` and the JSR packages verify through promises,
which the synchronous task kind excludes.
