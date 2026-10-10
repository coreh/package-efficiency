# RSA PKCS#1 v1.5 SHA-256 sign

One operation takes a 2048-bit RSA private key (PKCS#1 `RSA PRIVATE KEY`
PEM, public exponent 65537) and a UTF-8 message, signs the message with
RSASSA-PKCS1-v1_5 and SHA-256 (RFC 8017, section 8.2.1; the library hashes
the message itself) and returns the 256-byte signature. Parsing the key is
not timed: every adapter parses the PEM in `prepare`, once per fixture, as a
program that signs many messages with one key would, and the measured call is
the hash and the private-key operation alone.

This is the signing path only (no verification, no key generation). A verify
task would add the public-key path, which is much cheaper (e = 65537).

## Fixtures

The 24 fixtures use four keys, each for six messages, from empty to 8 KiB
(ASCII, JSON, log lines, Unicode: the messages of the other tasks of this
category). The scenario builds the keys itself, deterministically: the primes
come from a SHA-256 stream, sieved and tested with Miller-Rabin, so every
process builds the same four keys, and it writes the PKCS#1 DER and PEM
itself. The last message carries a suffix found once by search so that its
signature begins with a zero byte; a signer that returns the signature
integer's minimal bytes (255) instead of the full 256 fails on it.

PKCS#1 v1.5 signing is deterministic, so each fixture has one right answer.
The scenario computes it with its own signer (the RFC 8017 encoding and a
CRT exponentiation in BigInt arithmetic, checked by raising the signature to
e) and asserts at load that node:crypto reads every PEM as the same key and
produces the same signature, on Node, Bun and Deno.

## What counts as correct

Every signature is compared byte for byte with the expected one. There is no
tolerance. The signature may be returned as the library produces it: a byte
array (JavaScript, Rust; Python and Ruby through `describe`), a Go `[]byte`
(base64 through `encoding/json`) or hex text; it must be 256 bytes. The
scenario proves at load that the check refuses one fixture's signature for
every fixture, a signature made with another key, a signature over a SHA-1
digest, one flipped bit, the SHA-256 digest alone and a signature without its
leading zero byte.

## What differs between entries

The cost is the private-key operation. Libraries do it differently, and the
figure includes the difference; each adapter's notes say what its library
does:

- the Chinese Remainder Theorem (two 1024-bit exponentiations instead of one
  2048-bit one, about three to four times cheaper), which every entry here is
  expected to use with the CRT values the PEM carries;
- blinding (multiplying by a random value before the exponentiation and
  dividing it out after), a defence against timing attacks that costs an
  extra inversion and multiplications: OpenSSL and BoringSSL blind, Go's
  `crypto/rsa` does not (its arithmetic is constant-time instead), and the
  packages say in their notes whether their signing call blinds;
- the arithmetic: assembly in OpenSSL, BoringSSL and Go, GMP or a C module
  where a Python package has one, Python integers in `rsa`.

Blinding does not change the signature, so every entry gives the same bytes.
Packages run with their default settings as installed.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/node-crypto` | `crypto.sign('sha256', message, keyObject)` (PKCS#1 v1.5 is the default padding for RSA); `prepare` does `createPrivateKey(pem)` |
| `builtin/go-rsa` | `sha256.Sum256(message)` then `rsa.SignPKCS1v15(nil, key, crypto.SHA256, digest[:])`; `prepare` does `pem.Decode` and `x509.ParsePKCS1PrivateKey` |
| `builtin/ruby-openssl` | `key.sign('SHA256', message)`; `prepare` does `OpenSSL::PKey::RSA.new(pem)` |
| `pypi/rsa` | `rsa.sign(message, key, 'SHA-256')`; `prepare` does `rsa.PrivateKey.load_pkcs1(pem)` |
| `pypi/pycryptodome` | `pkcs1_15.new(key).sign(SHA256.new(message))`; `prepare` does `RSA.import_key(pem)` |
| `cargo/rsa` | `SigningKey::<Sha256>::new(key).sign(message).to_vec()` (`pkcs1v15`, trait `signature::Signer`); `prepare` does `RsaPrivateKey::from_pkcs1_pem(pem)` |

The message is encoded to bytes in `prepare` in every entry (it is not timed).
Where a library's signing object is built from the key (`pkcs1_15.new`,
`SigningKey::new`), it is built inside the measured call, because it is what
the documentation's examples do and it is cheap beside the exponentiation.

The package entries are written separately; this list says what each is to
call.

## Left out

- Python's standard library has no RSA (`hashlib` and `hmac` only), so there
  is no CPython or PyPy built-in entry.
- Web Crypto (`crypto.subtle.sign` with RSASSA-PKCS1-v1_5) is asynchronous
  only and cannot be an entry of a synchronous task; node:crypto stands for
  the runtimes' own implementation.
- Rust's standard library has no cryptography, and there is no `builtin`
  path for Rust.

See [shared methodology](../../README.md) for timing and reproduction.
