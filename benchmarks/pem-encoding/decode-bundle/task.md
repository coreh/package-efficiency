# Decode PEM bundles

One operation takes a text bundle and returns every PEM block in it, in order,
as a label and its decoded binary payload. The 40 fixtures are bundles of 1 to
37 blocks (certificates, PKCS#8, RSA and EC private keys, public keys; payloads
of 121 to about 1,600 random bytes), with 64-column base64 lines, LF or CRLF
line endings, and some with comment or `subject=` lines between blocks, as
`openssl` and certificate bundles have. ASN.1 inside the payload is never parsed.

A correct result lists the same labels and exactly the same payload bytes as
the generator wrote, in order. The verifier compares each payload (as base64)
with the generated one, so returning labels only, constants, or a payload that
is not decoded fails.

Accepted differences: `rustls-pemfile` does not return the label text; it
returns a typed item per recognised label (certificate, PKCS#1, PKCS#8, SEC1
key, public key). The adapter's untimed `describe` step maps each variant back
to its label. The fixtures only use those five labels, so no block is dropped.
The Go standard library returns the label and bytes directly. Packages run with
default settings. Result conversion to JSON (base64 of the payload) happens
once per fixture before timing; measured work is the library's decode and the
result's length.

Left out: `pem-rfc7468` decodes a single document per call and cannot walk a
bundle, so an adapter would have to split the text itself. No npm, JSR, Python
or Ruby entry does this job in its standard library or most-used packages
(Python's `ssl` and Ruby's `OpenSSL` handle one certificate or key).

## Entries

- `pem`: `pem::parse_many(input)`, returning `Vec<Pem>`.
- `rustls-pemfile`: `read_all(&mut input.as_bytes())` collected into `Vec<Item>`.
- Go `encoding/pem`: `pem.Decode` in a loop until no block remains.
