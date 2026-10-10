# AES-256-CBC encrypt

One operation encrypts one message with AES-256 in CBC mode, with PKCS#7
padding, and returns the ciphertext. There is no authentication tag. CBC with
PKCS#7 is the mode of older TLS suites, of many file and token formats and of
much application code that still exchanges encrypted fields with other systems.

An input is an object with three strings: `key` (32 ASCII characters, used as the
32 key bytes), `iv` (16 ASCII characters, the 16 IV bytes) and `text` (the
message). The strings are turned into bytes once per fixture, before any timing,
in every language, as UTF-8. The measured call is given the three byte arrays.
The 48 cases are JSON-like and log-like messages, some with non-ASCII text, each
with its own key and IV. Their UTF-8 lengths are exact and chosen around the
16-byte block: 0, multiples of 16 (where PKCS#7 adds a whole block of `0x10`),
one byte short of them (where it adds a single `0x01`) and one byte over, from
1 byte up to 64 KiB (65,536 bytes); 23 of the 48 are 1 KB or more.

## What counts as correct

A correct output is exactly the bytes Node's `crypto` module produces for the
same key, IV and plaintext with its default padding. `node:crypto` is also one
of the entries, so the scenario first checks it against a published known
answer (the CBC-AES256 encryption example of NIST SP 800-38A, F.2.5, two
blocks, and the extra whole block PKCS#7 adds to them), and on every fixture
checks that its output equals unpadded CBC over the message padded by the
scenario's own PKCS#7 (RFC 5652, section 6.3). CBC with a fixed key and IV is
deterministic and PKCS#7 has one spelling, so no differences are accepted: the
bytes must be identical, which also fixes the length (the message length
rounded up to the next multiple of 16, a whole block more when it already is
one). Outputs are compared as hex (JavaScript, Rust, Python, Ruby) or base64
(Go, whose `[]byte` results are marshalled that way); the conversion is done
once per fixture before any timing.

When the scenario loads it proves that the check refuses wrong outputs: the
last byte flipped, the ciphertext without its padding block, zero padding
instead of PKCS#7 (on a 1,024-byte and on a 1,023-byte message, where the two
differ in one byte), the IV put in front of the ciphertext, ECB and CTR of the
same input, CBC with a zero IV, the plaintext itself, another fixture's output,
and the bytes as a list of numbers.

Only encryption is measured; decryption and padding checks on the way back are
not part of this task. Each call builds its cipher object from the key and IV,
as the packages' documentation shows for one message with its own IV; nothing
is cached between calls. For the short messages creating that object, not
encrypting, is most of the cost, most of all in Node and Ruby, where it is an
OpenSSL cipher context; that is the cost of encrypting one message. CBC
encryption is serial (each block depends on the one before), so the long
messages measure the AES block function itself. Packages run with their default
settings and features as installed. The IV is the caller's: an API that only
makes its own random IV, or puts it in front of the ciphertext, is not this
operation.

Padding is the package's own, in the same call: a package whose cipher has no
PKCS#7 padding would need it written in the adapter, and that adapter would be
measuring its own code.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/node-crypto` | `createCipheriv('aes-256-cbc', key, iv)`, `update`, `final` (padding on by default), joined with `Buffer.concat` (Node, Bun and Deno) |
| `builtin/ruby-openssl` | `OpenSSL::Cipher.new('aes-256-cbc').encrypt` with `key` and `iv`, then `update + final` (padding on by default) |
| JSR `@noble/ciphers` | `cbc(key, iv).encrypt(text)` from `@noble/ciphers/aes.js` (PKCS#7 by default) |
| PyPI `pycryptodome` | `AES.new(key, AES.MODE_CBC, iv).encrypt(pad(text, 16))`, `pad` from `Crypto.Util.Padding` (PKCS#7 is its default style) |
| cargo `cbc` | `cbc::Encryptor::<aes::Aes256>::new(key, iv)` and the padded-to-`Vec` encrypt with `Pkcs7` (RustCrypto, with the `alloc` feature), returning a `Vec<u8>` |
| cargo `aws-lc-rs` | `PaddedBlockEncryptingKey::cbc_pkcs7(UnboundCipherKey::new(&AES_256, key))`, then `less_safe_encrypt` on a copy of the plaintext with `EncryptionContext::Iv128` of the IV; the copy grows by the padding and is returned |

The package entries are written separately; this list says what each is to
call.

## Left out

- Go's standard library: `crypto/cipher` has `NewCBCEncrypter`, but no padding,
  so the adapter would pad in its own code; it is left out for the reason above.
  (A task for CBC without padding, on whole blocks, could include it.)
- Python's standard library has no ciphers (`hashlib` and `hmac` only).
- The `aes` crate alone is only the block cipher, without a mode; it is the
  block cipher of the `cbc` entry. `ctr`, `chacha20` and `salsa20` are other
  modes or ciphers.
- `@roj/tgcrypto` offers AES-IGE, not CBC, as in `aes-256-ctr`.
- `aws-lc-rs`'s `PaddedBlockEncryptingKey::encrypt` makes its own random IV, so
  the entry uses `less_safe_encrypt`, which takes the caller's.

See [shared methodology](../../README.md) for timing and reproduction.
