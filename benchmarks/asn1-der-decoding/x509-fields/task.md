# X.509 certificate fields

One operation takes a DER-encoded X.509 v3 certificate, held in memory as
bytes, parses it with the library's typed X.509 parser and
returns an object with nine fields:

- `version` (3), `serial` (lowercase hex, no leading zeros),
- `subjectCN` and `issuerCN` (the common name, or `""` when absent),
- `subjectAttrs` and `issuerAttrs` (number of name attributes),
- `notBefore` and `notAfter` (Unix seconds),
- `extensions` (number of extensions).

This is a different job from `x509-structure`: there the generic element tree
is walked; here a typed certificate parser interprets the structure (names,
times, extensions) and the caller reads fields. The fixtures are stored as
lowercase hex; each adapter decodes them to bytes once, in its untimed
`prepare` step, so hex decoding is not measured. Each adapter maps the library's result
to the common shape inside the call.

The 40 certificates are built deterministically by the scenario: RSA (filler
2048-bit modulus), EC P-256 (real points) and Ed25519 keys, one to six name
attributes in subject and issuer (PrintableString and UTF8String, with
non-ASCII text), UTCTime and GeneralizedTime validity, one to seven
well-formed extensions (basic constraints, key usage, subject/authority key
id, SAN, extended key usage, CRL distribution points, authority info access).
Signatures are filler bytes: nothing is verified. A correct output equals the
generator's expected object exactly. Packages run with their default settings,
as installed.

Libraries differ in how much they decode eagerly. Go and Rust `x509-parser`
both parse the extensions they know while parsing the certificate
(`x509-parser` has `deep_parse_extensions` on by default); Go also parses the
subject public key, which `x509-parser` leaves as raw bytes. Both are
accepted, since the answer is the same.

Not covered: `@wildboar/asn1`, `der`, `der-parser`, `asn1-rs`, `simple_asn1`
and `yasna` are generic ASN.1 libraries with no X.509 model, so an adapter
would have to implement the certificate parsing itself; `spki`, `pkcs8`,
`pkcs1` and `const-oid` decode only parts of it.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- Rust: `x509-parser` `X509Certificate::from_der`.
- Standard library: Go `crypto/x509` `ParseCertificate`, Ruby
  `OpenSSL::X509::Certificate`.
