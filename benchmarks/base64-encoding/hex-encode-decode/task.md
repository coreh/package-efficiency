# Lowercase hex encoding and decoding

One operation takes a byte buffer, encodes it as lowercase hexadecimal text
(base16 of RFC 4648 section 8, two digits per byte, `0-9a-f`, no prefix, no
separators, no line breaks), then decodes that text back to bytes, and returns
both: the pair `[text, bytes]`. Both directions are timed in the same call,
because the packages are used for both (digests and keys written out as hex,
then read back), and the figure is their sum.

The 60 cases are deterministic pseudo-random binary payloads, sized as in the
sibling task `base64-to-bytes`: 20 values of 32 bytes (tokens and digests),
11 tiny payloads of 0 to 10 bytes (empty included), 10 of 100 to 900 bytes,
10 of 1 to 2 KB and 8 of 2 to 4 KB, plus one payload of the 256 byte values in
order, so every digit appears in both nibbles. Three payloads are patterned
(all zeros, all `0xff`, a short UTF-8 JSON text). About 45 KB in all; the
payloads of 1 KB and more are most of the bytes, so the figure is a mix of
per-call cost on short values and throughput on buffers of a few kilobytes.

The input is the payload as a JSON list of byte values. Each adapter's
`prepare` turns it into its language's byte type once per fixture, outside the
timed call. The input is not given as hex or base64 text, so no adapter is
handed the text it must produce, and none needs a second decoder to read it.

## What counts as correct

The text must equal `node:buffer`'s `toString("hex")` of the payload exactly,
and the bytes must equal the payload byte for byte. The check is strict: upper
case, a `0x` prefix, spaces or colons between bytes and line breaks all fail.
When the scenario loads it proves the check refuses wrong outputs: the input
unchanged, the hex text alone, the pair swapped, upper-case hex, hex with a
prefix or with spaces, base64 in place of hex, the hex text's own characters
as the decoded bytes, decoded bytes one short or reversed, another fixture's
pair and a constant pair.

The decoded bytes must come from decoding the text the call just produced,
not from the input: the check cannot see the difference (the bytes are the
same), so this is a rule for the adapters, kept by reading them. Every input
is valid hex of even length, so no error path is measured, and decoders that
also accept upper case or white space are neither rewarded nor penalised.

Accepted as equivalent: the byte container of the decoded half, as each
library returns it (`Uint8Array`, a Node `Buffer`, Python `bytes`, a Ruby
binary `String`, Go `[]byte`, Rust `Vec<u8>`), and the pair container (a
JavaScript array, a Python tuple, a Ruby array, a Go `[]any`, a Rust tuple).
Python, Ruby, Go and Rust turn the bytes into a list of integers for the
verifier outside the timed call (`describe`, or Go's `MarshalJSON`). The
entry from `node:buffer` is checked against the same function the reference
uses; the reference is plain enough (two digits per byte, in order) that the
other entries anchor it.

Every package runs with default settings as installed, in its one-shot form,
with no cached results between calls. Upper-case hex, hex dumps, streaming and
other base16 variants are outside this task.

## Packages

| Entry | What the adapter calls |
| --- | --- |
| `builtin/node-buffer` | `buffer.toString("hex")` and `Buffer.from(text, "hex")`, a `Buffer` |
| `builtin/js-uint8array-hex` | `bytes.toHex()` and `Uint8Array.fromHex(text)`, a `Uint8Array` (Bun and Deno only: the pinned Node.js 24 does not have these methods) |
| `builtin/python-bytes-hex` | `value.hex()` and `bytes.fromhex(text)`, `bytes` |
| `builtin/ruby-pack` | `value.unpack1("H*")` and `[text].pack("H*")`, a binary `String` |
| `builtin/go-hex` | `hex.EncodeToString(b)` and `hex.DecodeString(text)`, a `[]byte` |
| `jsr/@std/encoding` | `encodeHex(bytes)` and `decodeHex(text)` from `@std/encoding/hex`, a `Uint8Array` |
| `cargo/data-encoding` | `data_encoding::HEXLOWER.encode(&b)` and `HEXLOWER.decode(text.as_bytes())`, a `Vec<u8>` |
| `cargo/hex` | `hex::encode(&b)` and `hex::decode(&text)`, a `Vec<u8>` |
| `cargo/base16ct` | `base16ct::lower::encode_string(&b)` and `base16ct::lower::decode_vec(&text)`, a `Vec<u8>` |

The package entries are written separately; this list says what each is to
call.

## Left out

- `jsr/@stdext/encoding`: the release inside the seven-day window (0.1.0)
  exports only `dump` from `@stdext/encoding/hex`, a hex dump with offsets,
  spacing and an ASCII column, not plain hex, and no decoder. Every later
  release (0.1.1, 0.1.2, 0.2.0) is younger than seven days.
- Python `binascii.hexlify`/`unhexlify`: the same C code as `bytes.hex` and
  `bytes.fromhex`, returning `bytes` instead of `str` for the text; the
  standard library is represented once, by the methods on `bytes`.
