# Absolute URL parsing

One operation takes an absolute URL string and parses it into components:
scheme, userinfo, host, port, path, query and fragment. The 56 cases are http,
https and ftp URLs with userinfo, ports, long paths, percent-escapes, queries,
fragments, IPv4 hosts and mixed lengths.

Each adapter returns what its package returns: a WHATWG `URL` object, the
component object of an RFC 3986 parser, or Rust's `Url`. The verifier reads
either shape into the seven components and compares each with the parts the
fixture was built from, so a wrong split fails. That reading happens in the
verifier, never in the timed call; the timed call reads only the host's length.

Every input is already in canonical form for both the WHATWG URL Standard and
RFC 3986: lowercase scheme and host, no default port, a non-empty path, no dot
segments, and only escapes that no parser rewrites. This avoids rewarding or
penalizing the different normalization rules, which are not the subject of the
task.

Packages run with their default settings as installed. Inputs are
preconstructed. Serializing a URL back to a string, resolving relative
references, query-string decoding and validation of invalid URLs are outside
the task.

## Entries

- npm `whatwg-url`: `new URL(input)`.
- npm `uri-js`: `parse(input)`.
- npm `fast-uri`: `parse(input)`.
- builtin `js-url`: the runtime's global `URL`, `new URL(input)`.
- cargo `url`: `Url::parse(input)`.

`@jridgewell/resolve-uri`, `parseurl`, `tldts`, `iri-string` and
`@alistair/pathcat` are left out: they resolve paths, parse request paths,
extract domains, validate/borrow strings or build URLs rather than parse a
full absolute URL into components.
