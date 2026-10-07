# Content-Type header formatting

One operation takes `{ type, parameters }` (a lowercase `type/subtype` and an
object of lowercase parameter names to string values, already in alphabetical
order) and returns the header value as a string: the type, then each parameter as
`name=value`, separated by semicolons. A value that is not a plain token (it has
spaces, slashes, quotes or other separators) is written in double quotes with
`"` and `\` escaped.

The 48 cases cover bare types, `charset`, multipart `boundary` values (token and
needing quotes), structured suffixes, vendor types, values with a quote or
backslash, and up to four parameters.

Accepted as equivalent: whether a space follows each separating semicolon
(`; ` or `;`), since libraries differ and both are valid. Everything else must
match exactly: quoting, escaping, parameter order and values. The verifier also
requires that quoted values come back with the escapes the grammar needs, so an
implementation that returns the type alone, ignores quoting, or drops parameters
fails.

Libraries need their own object built from the input; that is part of the
measured call. `content-type` formats the object directly. `whatwg-mimetype`
has no way to build a `MIMEType` from parts: `new MIMEType(type)` parses the
type string with the library's full parser (the work of the sibling parsing
task), then each parameter is set through a validating `parameters.set`, then
`toString()` serializes. Its figure here is therefore parse, set and serialize,
not formatting alone.
Go `mime.FormatMediaType` takes a `map[string]string`, so the adapter converts the
decoded JSON map first (an extra cost the JavaScript adapters do not have).
`media-typer` (no parameters), `type-is` (infers types) and the Rust `mime` crate
(no way to build a `Mime` from parts without parsing a string) are left out.
Packages run with their default settings as installed.
See [shared methodology](../../README.md) for timing and reproduction.
