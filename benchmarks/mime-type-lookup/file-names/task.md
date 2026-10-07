# Media type from file name

One operation takes a file name (a string such as `assets/Photo.final.JPG`) and
returns its media type as a string (`image/jpeg`). The 78 cases mix plain names,
paths, names with several dots, upper-case and mixed-case extensions, over 13
extensions: html, htm, css, json, png, jpg, jpeg, gif, svg, pdf, wasm, webp, avif.

Only extensions on which every package and standard library agree are used, so
every case has one correct answer. Names with unknown extensions are not
included, because libraries report them differently (`false`, `null`, empty).
Reverse lookup (media type to extension), content sniffing and parsing media
type header values are outside the task.

Outputs must equal the expected type. A trailing parameter such as
`; charset=utf-8` (Go adds it for text types) and letter case are ignored
during validation only; native output is consumed during measurement.

Packages run with their default settings as installed. The `@std/media-types`
function takes an extension rather than a name, so that adapter takes the text
after the last dot first. Go (`mime.TypeByExtension(filepath.Ext(name))`) and
Python (`mimetypes.guess_type`) use their standard libraries, which may also read
the operating system's type tables; the fixtures only use types they all have.
See [shared methodology](../../README.md) for timing and reproduction.
