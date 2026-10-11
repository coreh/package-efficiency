# Schema-typed round trip

One operation takes a telemetry record and runs it through a binary format whose
schema is fixed in advance: it encodes the record to bytes and decodes those bytes
back into the typed record. The adapter returns the decoded record. This is the
other half of the category from the `records` task, where the format is
self-describing and the decoder rebuilds any JSON value: here the library knows the
fields and their types, as Protocol Buffers, Borsh and typed serde code do.

The schema has nine fields: `id` (int32), `name` (string), `active` (bool),
`score` (double), `tags` (list of strings), `samples` (list of int32), `readings`
(list of doubles), `location` (a nested record of two doubles and a string) and
`events` (a list of nested records: int32, string, double). The 48 fixtures vary
the lengths of every list (from empty to 600 numbers), include empty and non-ASCII
strings (accents, CJK, emoji), a 5,000-character string, int32 extremes and
doubles from 1e-7 to 1e10. Every fixture also carries an extra field, `trace`,
that is not in the schema.

A correct output has exactly the schema's fields with the input's values. The extra
`trace` field must not survive: a library that knows the schema does not carry
unknown data, so handing the input back (or a copy of it) fails. For JavaScript the
verifier also requires that the result is not the input object. Numbers may come
back as numbers or BigInt/Long-like values the check converts; the default
protobufjs message keeps its default values (empty string, 0, empty list) on the
prototype, so the check reads each field by name.

For the Rust, Python, Ruby and Go adapters the verifier sees only JSON, so the untimed
describe step reports the decoded record with `encodedBytes`, the length of the
buffer from a second, untimed encode, which must be positive. As in the `records`
task this shows the encoder yields bytes; it does not prove the timed call used them.

Setup done once in real code is done once outside the timed call: protobufjs loads
its schema (reflection, no code generation) at module load; Rust and Go types are
compiled; the Python, Ruby and Go schemas, descriptors and classes are built once,
without `protoc` or other code generators.

The measured call is encode plus decode in every adapter. The native runners hand
adapters the fixture as parsed JSON, so each native adapter fills its typed struct,
message or class from it once per fixture, in an untimed prepare step (in Rust with
serde's `Deserialize`), and the timed call starts from there. The JavaScript
adapter encodes the plain input object directly with protobufjs, which needs no
conversion. JavaScript has a single entry, so there is no within-JavaScript
comparison here.

Formats: Protocol Buffers (protobufjs, prost, Python `protobuf`, Ruby
`google-protobuf`, and in Go `google.golang.org/protobuf`, `golang/protobuf`,
`gogo/protobuf` and `jhump/protoreflect`), Borsh, bincode, rkyv (archived, then
deserialized into an owned record), the D-Bus format (zvariant), Avro (fastavro),
Thrift binary (Python and Ruby `thrift`), BinData's declared layout, MessagePack
(rmp-serde in its default array form, fields by position; msgspec and the Go
packages as maps with field names) and CBOR (ciborium, serde_cbor: a map with every
field name written out). The entries share one ranking, so the ranking does compare
formats as well as libraries: a library is measured on the format it implements,
and a format that writes field names does more work per record. Left out:
schemaless JSON-value codecs (`@std/msgpack`, `@std/cbor`) have no schema to apply
and are measured in `records`; `flatbuffers` is a builder API that cannot decode
into an owned record; and `protobuf` (rust-protobuf) needs generated code from
`protoc`. Packages run with default settings as installed.
See [shared methodology](../../README.md).
