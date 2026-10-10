# ECDSA P-384 verify

One operation takes a public key (a 97-byte uncompressed SEC1 point on NIST
P-384), a signature (96 bytes, r then s, 48 bytes each, big-endian) and a
UTF-8 message, verifies the signature with ECDSA over P-384 with SHA-384 (the
package hashes the message itself) and returns a boolean: true for a valid
signature, false for an invalid one. A signature that is well formed but does
not verify is a normal `false`, not an error. Key parsing, including the check
that the point is on the curve, happens inside the measured call in every
language (each fixture has its own key); there is no key or curve setup to
hoist.

This is the sibling of `ecdsa-p256-verify` on the larger NIST curve, with the
same messages and the same kinds of invalid signature. It is the verification
path only (no signing, no key generation).

## Fixtures

The 48 fixtures use 48 different keys and messages from empty to 8 KiB (the
messages of `ecdsa-p256-verify`: ASCII, JSON, log lines, Unicode). Half are
valid. The other half are invalid in three ways, rotating: the message has one
character appended, the signature's s has its last bit flipped (still in range
and still low-s), or the signature is valid for a different key.

The scenario builds the keys and signatures itself, deterministically: the
private scalars come from a hash, the nonces from HMAC-SHA384 of the key and
the digest, and s is normalised to the low half, so libraries that reject a
high-s signature (`@noble/curves` by default) give the same answer as those
that accept it on every fixture. The scenario carries its own small ECDSA
verifier (SEC 1, section 4.1.4, in BigInt arithmetic) and asserts at load
that the curve constants are right (G is on the curve and has order n), that
its public keys match OpenSSL's, that its verifier agrees with every
expectation, and that node:crypto does too.

## What counts as correct

Every boolean is compared exactly with the expectation known from
construction. There is no tolerance. The scenario proves at load that the
check refuses an adapter that always returns true, one that always returns
false, every answer inverted, 1 and 0 instead of booleans, and one that
ignores the message (true unless the key or the signature was changed).

Fixtures are shared as JSON, so the key and signature are lowercase hex
strings and the message is a string. Every adapter defines `prepare`, which
decodes the hex into the language's byte type and encodes the message as
UTF-8 bytes once per fixture, before any timing; the measured call does no
hex decoding. Where a library takes the signature in another form than r||s
(DER for OpenSSL), `prepare` converts it, and the adapter's notes say so.
Packages run with their default settings and features as installed.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/node-crypto` | `createPublicKey({ key: spki_header + point, format: 'der', type: 'spki' })` then `crypto.verify('sha384', message, { key, dsaEncoding: 'ieee-p1363' }, signature)` |
| `builtin/go-ecdsa` | `ecdsa.ParseUncompressedPublicKey(elliptic.P384(), pk)`, `sha512.Sum384(message)`, then `ecdsa.Verify(pub, digest, r, s)` with r and s as `big.Int` |
| `builtin/ruby-openssl` | `OpenSSL::PKey.read(spki_header + point)` then `key.verify('SHA384', der_signature, message)`; `prepare` turns r‖s into DER |
| `cargo/p384` | `VerifyingKey::from_sec1_bytes(pk)`, `Signature::from_slice(sig)`, then `key.verify(message, &sig).is_ok()` (trait `signature::Verifier`, SHA-384 by default) |
| `jsr/@noble/curves` | `p384.verify(sig, message, pk)` from `@noble/curves/nist.js` (hashes with SHA-384 by default) |
| `pypi/ecdsa` | `VerifyingKey.from_string(pk, curve=NIST384p, hashfunc=sha384).verify(sig, message)`; `BadSignatureError` is `False` |

The package entries are written separately; this list says what each is to
call.

## Left out

- Python's standard library has no ECDSA at all (`hashlib` and `hmac` only),
  so there is no Python built-in entry.
- Rust has no cryptography in its standard library.
- Web Crypto (`crypto.subtle.verify` with ECDSA P-384) is asynchronous, so it
  cannot be an entry of this synchronous task.

See [shared methodology](../../README.md) for timing and reproduction.
