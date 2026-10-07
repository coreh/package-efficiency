# HTTP request head parsing

One operation parses one raw HTTP/1.x request held in memory as a string: the
request line and the headers. The 48 cases are browser-style requests (Chrome,
Safari, Firefox and curl headers, cookies, conditional headers, repeated
`X-Forwarded-For`, bearer tokens), with GET, POST, PUT, PATCH, DELETE, OPTIONS
and HEAD, query strings and percent-escapes in the target, a few HTTP/1.0
requests, and JSON bodies after the head on writes.

A correct result has the method, the request target exactly as sent, the minor
version and every header, with repeated headers kept in order. Header names are
compared case-insensitively because the packages differ: httparse keeps the
spelling sent, the `http` crate (used by ureq-proto) lowercases, and Go
canonicalizes. Results may list headers as ordered pairs or as a name-to-values
map; the checker groups them by lowercase name, keeping value order. Go moves
`Host` out of its header map, so its adapter puts it back. Bodies are not
parsed: only the head is in scope, and a parser may stop at the end of the head.

Packages run with their default settings as installed. Responses, chunked
decoding, partial or invalid messages and full servers are outside the task.
No npm or JSR package in this category parses raw HTTP bytes, so it compares
two Rust crates and the Go standard library. Python's standard library parses
headers only from file objects and Ruby has no standard parser, so neither
is included.

- `httparse`: `Request::parse` with a 100-header array on the stack. It is
  zero-copy: the parsed request borrows from the input. The measured call
  parses and reads lengths and the header count; nothing is copied out. For
  the verifier, the same parse is run again outside measured work and its
  fields copied to JSON.
- `ureq-proto`: `parser::try_parse_request::<100>`, which runs httparse and
  builds an `http::Request`; returned as is.
- Go `net/http`: `ReadRequest` over a `bufio.Reader` on the string.

See [shared methodology](../../README.md) for timing and reproduction.
