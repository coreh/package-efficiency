# Extension from media type

One operation takes a media type (a lower-case string such as `image/jpeg`) and
returns one file extension for it as a string (`jpg`). It is the reverse of the
`file-names` task. The 80 cases cycle through 36 common types (text, images,
fonts, audio, video, archives, office documents) with no parameters.

Several types have more than one extension (`image/jpeg` is `jpg`, `jpeg` or
`jpe`). Libraries pick a different default, so the check accepts any extension
from a fixed list per type, with or without a leading dot, in any letter case.
A wrong type, an empty string, `null`, `false` or `undefined` fails. Only types
every package and standard library knows are used. Go and Python return a list
or a dotted extension; the Go adapter takes the first element of
`mime.ExtensionsByType`, Rust takes the first of `get_mime_extensions_str`, and
every library's own table is used.

Go does a larger job than the others here and has no smaller call:
`mime.ExtensionsByType` parses the media type as a header value, copies the
type's whole list of extensions and sorts the copy on every call, where the
other libraries look up one extension (or, in `mime_guess`, a static list).
Its figure includes that work.

Packages run with their default settings as installed. Content sniffing,
parsing media type header values and unknown types are outside the task. Go and
Python may also read the operating system's type tables.
See [shared methodology](../../README.md) for timing and reproduction.

Note: `mime_guess` lists extensions alphabetically, so its first entry is
sometimes an obscure one (`ecma`, `jfif`, `slk`, `asa`, `asm`); those are in the
accepted lists because they really are registered for the type in its table.
Types missing from some library's table (markdown, gzip, woff, otf) were left out.
