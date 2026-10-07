# Relative reference resolution

One operation takes a pair `[base, reference]` of strings and returns the
resolved absolute URL as a string. The base is an absolute http or https URL
(some with userinfo, port or query); the reference is one of 37 kinds: plain
and dotted relative paths (`g`, `./g`, `../../g`, `g/./h`, `..`), more `..`
than the base has segments, root-relative paths, query-only and fragment-only
references, scheme-relative `//host/path` references and absolute URLs. 108
pairs combine 9 kinds of base with them. Each pair carries its own index in the
base's host and in the reference's name, query or fragment, so the bases and
most references are distinct strings; only the six dot-only references (`.`,
`./`, `..`, `../`, `../..`, `../../`) repeat.

The expected strings come from a small resolver written from RFC 3986 section
5.2 inside the scenario. Every pair avoids what the WHATWG URL Standard and
RFC 3986 normalize differently (letter case, default ports, empty paths,
spaces, absolute references containing dot segments), so all correct
packages produce the same string. The verifier compares each output exactly,
also requires that no dot segments remain, and so fails an adapter that
returns its base, its reference or a constant.

Each adapter parses both strings inside the call and returns the resulting
string: `new URL(ref, base).href`, `resolve(base, ref)`, `Url::join`, Go's
`ResolveReference(...).String()`, and so on. Where a library returns its own
type (`url::Url`, an `iri-string` string type) the adapter keeps that type; the
timed call reads only its length. Packages run with their default settings
as installed. The adapters cache nothing. A library's own cache is left on:
`urllib.parse` under PyPy memoizes its last 128 split strings (CPython 3.14's
`urljoin` does not). One pass over the fixtures has more distinct strings than
that, so the cache serves only the repeated dot-only references.

## Entries

- npm `whatwg-url`: `new URL(ref, base).href`.
- npm `uri-js`: `resolve(base, ref)`.
- npm `fast-uri`: `resolve(base, ref)`.
- builtin `js-url` (runtime global `URL`), `python-urljoin` (`urllib.parse.urljoin`),
  `ruby-uri` (`URI.join`), `go-net-url` (`url.Parse` twice and `ResolveReference`).
- cargo `url`: `Url::parse(base)?.join(ref)`.
- cargo `iri-string`: `UriReferenceStr::resolve_against(UriAbsoluteStr)`, converted to an owned `UriString`.

`@jridgewell/resolve-uri` was tried and removed: it is a source-map path
resolver and returns a different result for `./g/.` against a base with a
query. `parseurl`, `tldts` and `@alistair/pathcat` do not resolve references.
The base fixtures use http and https only because Ruby's `URI.join` fails on
ftp bases.
