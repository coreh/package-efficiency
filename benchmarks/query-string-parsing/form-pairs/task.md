# Percent-encoded key-value pairs

One operation decodes one query string (no leading `?`) in `application/x-www-form-urlencoded`
syntax and returns a map from each key to its value, both as decoded text.

The 48 cases hold from 1 to 30 pairs each, joined by `&`. Keys and values are
percent-encoded UTF-8 (accented text, CJK, emoji, and the reserved characters `& = + % # / ? [ ]`
inside values), with a space written either as `%20` or as `+`. Keys are unique, plain
names (letters, digits, `_`, `-`) and none looks like a number. There is also an empty query string, which
decodes to an empty map. A correct result maps every key to its exact decoded value. The check
compares the whole map, ignoring key order.

Accepted differences: the order of keys in the result, and the container type (object,
dict, hash, map). Packages that return a list of pairs or a map of lists are mapped to a
plain key-to-string map inside the timed call, in every language alike; where the package
already returns the map (`qs`, `node:querystring`, `serde_urlencoded`, Python and Ruby
helpers collecting pairs) the adapter returns it as is. Packages run with their default
settings as installed.

Not covered: repeated keys, nested keys such as `a[b]=c`, arrays, empty values and keys
without `=` (Python drops blanks by default), `;` separators, malformed escapes, and
encoding maps back to strings. Parsing the rest of the URL and multipart bodies is out of scope.

See [shared methodology](../../README.md) for timing and reproduction.
