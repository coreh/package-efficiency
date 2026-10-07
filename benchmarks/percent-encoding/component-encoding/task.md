# Percent-encoding a URL component

One operation percent-encodes a string so it can be used as a single URL
component (a query value or path segment): every character other than
`A-Z a-z 0-9 - _ . ~` becomes its UTF-8 bytes written as `%XX`. This includes
`/ ? # & = + %` and space. Not whole-URL encoding (which leaves reserved
characters alone), not decoding, not query-string splitting.

The 61 inputs are 40 to 240 characters of mixed plain text, URLs, form-like
text, punctuation, Latin accents, CJK, Cyrillic, Arabic, emoji and control
characters, plus an empty string. Outputs are checked against an independent
byte-wise oracle, and any input containing a character that must be escaped
must come back changed.

Accepted as equivalent, in verification only: lowercase vs uppercase hex, `+`
for a space (Go `QueryEscape`), and `! ' ( ) *` left literal (`encodeURIComponent`,
`urlencoding`), since all decode to the same text. Measured calls keep each
library's native spelling and consume only the result length.

Packages run with default settings. `encodeurl` is left out: it encodes a whole
URL and deliberately leaves `/ ? # & = :` and existing `%XX` sequences alone,
which is a different job. Rust `percent-encoding` needs the escape set stated;
the adapter uses a constant set of everything except the unreserved characters,
and returns the crate's lazy encoder converted to a string.
