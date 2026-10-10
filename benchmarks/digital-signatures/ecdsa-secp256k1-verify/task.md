# ECDSA secp256k1 verify of prehashed messages

One operation takes a public key (a SEC1 point on secp256k1, 33 bytes
compressed or 65 bytes uncompressed), a signature (64 bytes, r then s,
big-endian) and a 32-byte SHA-256 digest, and returns a boolean: true for a
valid signature, false for an invalid one. The digest is verified as given:
no adapter hashes anything. That is the form libsecp256k1 and its peers take
(Bitcoin and Ethereum sign transaction hashes, not messages), so unlike the
sibling `ecdsa-p256-verify` the input is the digest and not the message. A
signature that is well formed but does not verify is a normal `false`, not an
error. Key parsing, including decompressing a compressed point, happens inside
the measured call in every language (each fixture has its own key); there is
no key or curve setup to hoist, except where a library needs a context object
(see Entries).

This is the verification path only (no signing, no key generation, no public
key recovery).

## Fixtures

The 48 fixtures use 48 different keys, and digests of 48 different messages
from empty to 8 KiB (the messages of `ecdsa-p256-verify`; only their SHA-256
is in the fixtures). Keys alternate in pairs between the compressed and the
uncompressed form, so each form meets valid fixtures and every kind of invalid
one. Half are valid. The other half are invalid in three ways, rotating: the
digest is that of another message (the original with one character
appended), the signature's s has its last bit flipped (still in range and
still low-s), or the signature is valid for a different key (given in the
same form as the fixture's own).

The scenario builds the keys and signatures itself, deterministically: the
private scalars come from a hash, the nonces from HMAC-SHA256 of the key and
the digest, and s is normalised to the low half (BIP 62). libsecp256k1 rejects
a high-s signature as invalid while most other libraries accept it; with
every signature low-s, the two rules give the same answer on every fixture.
The scenario carries its own small ECDSA verifier (SEC 1, section 4.1.4, in
BigInt arithmetic) and asserts at load that it agrees with every expectation;
on Node it also checks each fixture with node:crypto, verifying the message
whose SHA-256 is the digest.

## What counts as correct

Every boolean is compared exactly with the expectation known from
construction. There is no tolerance. The scenario proves at load that the
check refuses an adapter that always returns true, one that always returns
false, every answer inverted, 1 and 0 instead of booleans, and one that
ignores the digest (true unless the key or the signature was changed).

Fixtures are shared as JSON, so the key, signature and digest are lowercase
hex strings. Every adapter defines `prepare`, which decodes them into the
language's byte type once per fixture, before any timing; the measured call
does no hex decoding. Where a library takes the signature in another form
than r||s (DER for OpenSSL), `prepare` converts it, and the adapter's notes
say so. Packages run with their default settings and features as installed.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/ruby-openssl` | `OpenSSL::PKey.read(spki_header + point)` then `key.verify_raw(nil, der_signature, digest)`; `prepare` turns r‖s into DER |
| `cargo/secp256k1` | `PublicKey::from_slice(pk)`, `ecdsa::Signature::from_compact(sig)`, `Message::from_digest(d)`, then `secp.verify_ecdsa(&msg, &sig, &pk).is_ok()` with a `Secp256k1::verification_only()` context |
| `cargo/k256` | `VerifyingKey::from_sec1_bytes(pk)`, `Signature::from_slice(sig)`, then `verify_prehash(&d, &sig).is_ok()` (trait `hazmat::PrehashVerifier`) |
| `gomod/decred-dcrd-dcrec-secp256k1` | `secp256k1.ParsePubKey(pk)`, r and s with `ModNScalar.SetByteSlice`, then `ecdsa.NewSignature(&r, &s).Verify(d, pub)` |
| `jsr/@noble/secp256k1` | `verify(sig, d, pk, { prehash: false })` |
| `jsr/@noble/curves` | `secp256k1.verify(sig, d, pk, { prehash: false })` from `@noble/curves/secp256k1.js` |
| `pypi/ecdsa` | `VerifyingKey.from_string(pk, curve=SECP256k1).verify_digest(sig, d)`; `BadSignatureError` is `False` |

The `secp256k1` crate builds the C library libsecp256k1 with `cc` as part of
the crate (no system library is used). The context object of `secp256k1` is
created once, outside the measured call (in `prepare`'s scope or a static),
because the library's documentation has a program make one and share it; it
is the "context object" exception named above, and the adapter's notes say
so. Every other entry has nothing to create.

The package entries are written separately; this list says what each is to
call.

## Left out

- node:crypto, Bun and Deno: node:crypto can verify secp256k1 on Node, but its
  `verify` always hashes the message it is given, so it cannot take the
  digest, and Bun's BoringSSL has no secp256k1 at all. Web Crypto has no
  secp256k1. There is no JavaScript built-in entry.
- Go's standard library has no secp256k1 (`crypto/elliptic` offers only the
  NIST curves), and Python's has no ECDSA at all.

See [shared methodology](../../README.md) for timing and reproduction.
