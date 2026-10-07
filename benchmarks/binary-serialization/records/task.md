# Record round trip

One operation takes a JSON-compatible record (nested objects, arrays, integers,
fractions, strings, booleans, null), encodes it to a binary format and decodes
those bytes back into a value. The adapter returns the decoded value. The 48
cases are user-like records of growing size: short and long strings (including
non-ASCII and emoji), integers from small to beyond 32 bits and negative,
fractional numbers, empty arrays and objects, arrays and objects with more than
16 and more than 256 entries, and deeply nested lists.

A correct output deep-equals the input: same keys and values, same types
(number, string, boolean, null, array, plain object). Key order is not checked.
Handing the input back is not a round trip, and the check guards against it as
far as the harness allows. For JavaScript adapters, which are verified in
process, an object or array result must not be the same object as the input.
For Rust, Python and Ruby adapters the verifier sees only JSON, so object
identity cannot be checked; instead the untimed describe step reports the
decoded value together with `encodedBytes`, the length of the byte buffer the
adapter's encoder produces for it, which must be a positive integer. Limit: the
timed call returns only the decoded value, so that length comes from a second,
untimed encode in describe, not from the bytes of the timed call. It shows that
the encoder produces a non-empty byte buffer for every fixture; it does not
prove that the timed call used it.
Scope: numbers are either integers within 2^53 or non-integral doubles; NaN,
infinities, negative zero, dates, binary blobs and big integers are excluded
because formats and libraries differ on them.

Packages may use different formats (MessagePack, CBOR) or the language's own
binary format (V8 serialize, Python pickle, Ruby Marshal). Each is a compact
binary encoding that round trips this data, and the task accepts any of them;
the format is not compared. Schema-based formats (Protocol Buffers, Borsh,
rkyv) and formats that cannot decode a self-describing value (bincode) are left
out because they cannot decode arbitrary JSON-shaped data without a schema.
Packages run with default settings as installed. The timed output is the
decoded value, of which only a length is read; the Rust describe step is not
timed. See [shared methodology](../../README.md).

The fixtures are not equal in size. One fixture is a single 70,000-character
ASCII string; measured as JSON text it is 70,011 of the 99,609 bytes across all
48 fixtures, about 70%. Every fixture is called equally often, so about 70% of
the bytes a run encodes and decodes belong to that one string, and a package's
figure depends heavily on how fast it copies a long string.

Fractional values in the fixtures are short decimals (at most three places),
so every parser reads them exactly, including the Rust fixture loader.

Accepted equivalence: a decoder may return objects with a null prototype
instead of `Object.prototype`; the check compares them by content.

Accepted equivalence: integers beyond 32 bits may decode as BigInt instead of
number (as `@std/cbor` does); the check converts them to numbers, and every
fixture integer is within 2^53 so no precision is lost.
