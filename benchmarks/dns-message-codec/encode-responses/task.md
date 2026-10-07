# Encode DNS responses

One operation takes a description of a DNS response and returns its wire-format
encoding (RFC 1035), a byte string.

An input is `{ id, aa, rd, ra, question: { name, type }, answers: [...] }`. Each answer
is `{ name, ttl, type, data }` with type `A` and `AAAA` (address text), `CNAME` (a name),
`MX` (`{ preference, exchange }`) or `TXT` (an array of strings). Names are lower-case
ASCII with a trailing dot. The message is a response (QR set) with opcode query and
response code no-error. The 40 fixtures carry 1 to 12 answers (most have 10) over seven
zones, with owners and targets that share suffixes, TTLs from 0 to 4294967, TXT strings
up to 200 bytes and one empty string.

A correct output decodes, with a decoder written in the scenario that follows
compression pointers, to exactly the described header bits, one question and the
answers in order, with the right types, TTLs and data. How a library compresses repeated
names is not compared; any valid compression passes, and output is not required to be
byte-identical across packages. The check fails a result that is empty, constant or
echoes the input.

The message is built from the description inside the timed call in every adapter (parsing
names and addresses into the library's types is part of the work), then encoded once.
Packages run with their default settings as installed.

There are two entries, in two languages: Ruby's `resolv` and the Rust crate
`hickory-proto`. The task is therefore a comparison across languages only; no
package is graded against a peer in its own language.

Left out: `hickory-resolver` and `@layered/dns-records` query name servers over the
network and have no message codec, so they are out of scope for a synchronous call.
No npm package of this category offers wire-format encoding. Python and Go standard libraries
have no DNS message encoder; Ruby's `resolv` library does. Decoding and re-encoding
are not measured here, because feeding wire bytes into a call needs an input conversion
that every language would pay differently.
