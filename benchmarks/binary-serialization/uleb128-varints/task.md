# Unsigned LEB128 varints

One operation takes a list of 1,000 unsigned 64-bit integers, encodes each as
an unsigned LEB128 varint (seven bits per byte, the low group first, the high
bit set on every byte but the last, no padding: the varint of DWARF,
WebAssembly and Protocol Buffers' unsigned fields) appended to one byte
buffer, then decodes that buffer back into a list of integers, and returns
both: the pair `[bytes, values]`. Both directions are timed in the same call,
because the packages are used for both (writing and reading a binary format),
and the figure is their sum.

Every package in this task encodes and decodes one integer per call, so every
adapter runs the same two loops around it:

1. Encode: create a byte buffer with room for 10 bytes per value (the most a
   64-bit value can take), and for each value in order encode it with the
   package's per-value function and append the bytes it wrote.
2. Decode: create a list with room for the input's count, and starting at
   offset 0, decode one value with the package's per-value function, which
   reports how many bytes it read; append the value, advance the offset by
   that many bytes, and repeat until the offset reaches the end of the buffer.
   A decoding error ends the call with an error.

The loops do no work of their own beyond appending and advancing, so the
figure is 1,000 encodes and 1,000 decodes plus the same loop overhead in
every entry; read it as a per-value cost multiplied by 1,000. The decoder
reads the bytes the call just produced and stops at their end, not at the
input's count.

The 6 cases are 1,000 values each, built deterministically: every encoded
length from 1 to 10 bytes 100 times each, shuffled; small values dominating as
in real streams (length 1 with probability 1/2, 2 with 1/4, and so on); the
edges of every length (2^(7k) - 1 and 2^(7k) with their neighbours, 0, 1,
2^63 - 1, 2^63 and 2^64 - 1) cycled; only 10-byte values (2^63 and above,
which fit neither a signed 64-bit integer nor a double); only 1-byte values
(0 to 127); and values uniform below 2^32. The encodings are 1,000 to 10,000
bytes, about 29 KB in all.

The input is the list as decimal strings, because a JSON number loses
precision above 2^53. Each adapter's `prepare` parses it into its language's
unsigned 64-bit integers (Go `[]uint64`, Rust `Vec<u64>`) once per fixture,
outside the timed call.

## What counts as correct

The bytes must equal the scenario's own reference encoder exactly, and the
decoded list must equal the input, value for value, in order. The reference
is checked when the scenario loads against published examples (624485 is
`e5 8e 26`; DWARF's 2, 127, 128, 129, 130 and 12857), 2^63 and 2^64 - 1 (`ff`
nine times, then `01`). There is no tolerance. When the scenario loads it also
proves that the check refuses wrong outputs: the input unchanged, the bytes
alone, the pair swapped, empty bytes with the input as the values, values as
JSON numbers or passed through a double, values truncated to 32 or 63 bits, a
value missing, the values reversed, groups written high first (BER, as Ruby's
`pack("w")` does), a padding byte on short values, zigzag (signed) encoding,
bytes one short, the last byte with its continuation bit set, another
fixture's pair and a constant pair.

The decoded values must come from decoding the bytes the call just produced,
not from the input: the check cannot see the difference, so this is a rule
for the adapters, kept by reading them. Every input is canonical (shortest
form), so decoders that also accept or reject overlong encodings are neither
rewarded nor penalised, and no error path is measured.

Accepted as equivalent: the byte container (Go `[]byte`, Rust `Vec<u8>`) and
the integer list container (`[]uint64`, `Vec<u64>`), as each adapter builds
them. Go and Rust turn the bytes into a list of byte values and the integers
into decimal strings for the verifier outside the timed call (`describe`, or
Go's `MarshalJSON`); a JavaScript entry would return the values as BigInt.

Every package runs with default settings and features as installed.
Signed LEB128, zigzag, fixed-width (padded) encodings, streaming readers and
writers and 128-bit values are outside this task.

## Packages

| Entry | What the adapter calls |
| --- | --- |
| `builtin/go-binary-uvarint` | `binary.AppendUvarint(buf, v)` per value, and `binary.Uvarint(buf[offset:])` per value, which returns the value and the bytes read, from `encoding/binary` |
| `cargo/leb128fmt` | `leb128fmt::encode_u64(v)` per value (an array and the length written; the first `length` bytes appended), and `leb128fmt::decode_uint_slice::<u64, 64>(&bytes, &mut pos)` per value, which advances `pos` |
| `cargo/integer-encoding` | `VarInt::encode_var(v, &mut scratch)` per value into a 10-byte array, the bytes written appended, and `u64::decode_var(&bytes[offset..])` per value, which returns the value and the bytes read |

The package entries are written separately; this list says what each is to
call.

## Left out

- JavaScript: no package in the cluster takes values above 2^53, which need
  BigInt, and no JavaScript runtime has LEB128 in its standard library.
- Python, Ruby and Rust have no unsigned LEB128 in their standard libraries.
  Ruby's `Array#pack("w")` is the BER compressed integer, which writes the
  seven-bit groups high first: another encoding, refused by the check.
- No PyPI, RubyGems or Go-module package is in the cluster.
