# X.509 certificate structure

One operation takes a DER-encoded X.509 certificate, held in memory as
bytes, decodes it with the library and returns a flat list of
integers: one per ASN.1 element, in depth-first pre-order, each equal to
`tag class * 100 + tag number` (class 0 universal, 1 application, 2
context-specific, 3 private). Elements are descended into when their encoding
is constructed (SEQUENCE, SET, explicit `[0]` version and `[3]` extensions).
The contents of primitive elements, including OCTET STRING and BIT STRING
payloads such as extension values and public keys, are not descended into.

The 40 certificates are built by the scenario from a deterministic generator:
RSA, EC and Ed25519 key shapes, one to six name attributes (PrintableString,
UTF8String, IA5String), UTCTime and GeneralizedTime validity, with and without
the version and extensions fields, two to eight extensions, long-form lengths.
Signatures and keys are filler bytes: nothing is verified.

The fixtures are stored as lowercase hex; each adapter decodes them to bytes
once, in its untimed `prepare` step, so hex decoding is not measured. Each library
is asked for its full decoded tree (not a typed X.509 view), and the
adapter maps that tree to the common list inside the call, in every language.
Libraries that interpret values while decoding (integers, OIDs, times,
strings) do that work; lazier ones do less. Both are accepted, since
the answer is the same. A correct output equals the generator's expected list
exactly. Packages run with their default settings, as installed.

Rust crates return their own trees (`der::AnyRef`, `DerObject`,
`ASN1Block`); the list is built inside the measured call and its length is
read to consume it. Conversion to JSON for the verifier happens once per
fixture, outside measured work.

Not covered: typed X.509 parsers such as `x509-parser`, `spki`, `pkcs8`,
`pkcs1` and `const-oid`, which decode specific structures rather than a
generic element tree.
See [shared methodology](../../README.md) for timing and reproduction.

## Packages

- JSR: `@wildboar/asn1` `DERElement`.
- Rust: `der` `AnyRef`, `der-parser` `parse_der`, `simple_asn1` `from_der`.
- Standard library: Go `encoding/asn1` `RawValue`, Ruby `OpenSSL::ASN1.decode`.
