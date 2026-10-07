# Content-Type header value parsing

One operation parses a media type string, as found in a `Content-Type` header,
into `{ type, parameters }`: `type` is the lowercase `type/subtype` and
`parameters` maps each lowercase parameter name to its value, with quotes removed.
No value contains an escaped quote or backslash: the `mime` crate rejects
those, so that part of the syntax is outside the task. Libraries that return their own type (a class instance, a
`Mime`) are mapped to this shape inside the measured call, in every language.

The 48 cases are well-formed values: plain types, `charset` parameters, multipart
`boundary` values (token and quoted, with spaces), structured
suffixes such as `application/vnd.api+json`, vendor types, and several parameters.
Parameter values keep their case, except charset values, which are lowercase in the inputs (the mime crate compares charset case-insensitively and does not return the original spelling); type and subtype are lowercase in the inputs.
Malformed input, duplicate parameters, parameter-name case, content sniffing, extension
tables and negotiation are outside the task. Results must equal an independent
oracle exactly.

Packages run with their default settings as installed. `media-typer` is left out
(it does not accept parameters) and `type-is` infers request types rather than parsing.
Re-serializing is not part of the operation: the other libraries differ in whether they offer it.
See [shared methodology](../../README.md) for timing and reproduction.
