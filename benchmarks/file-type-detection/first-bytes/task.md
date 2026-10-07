# Type of a file from its first bytes

One operation takes the first bytes of a file, held in memory as bytes, asks
the library what it is, and returns the media type string the library names
(or null when it names none). No file name, extension or path is given: the
content decides.

The 56 fixtures are built by the scenario from a deterministic generator: 14
formats (PNG, JPEG, GIF, WebP, BMP, PDF, ZIP, gzip, WebAssembly, WAV, MP4,
MP3, RAR, Ogg), each at four prefix lengths (64, 300, 1,024 and 4,096 bytes)
with the variants real files have (JFIF or Exif JPEG, GIF87a or GIF89a, the
VP8, VP8L and VP8X WebP chunks, ID3v2.3 or v2.4, RAR 4 or 5, stored or
deflated ZIP). Each is a genuine header followed by random filler. They are
stored as lowercase hex; each adapter decodes them once, in its untimed
`prepare` step, so hex decoding is not measured. The formats are the ones that
Rust `infer`, `filetype`, `marcel` and Go's sniffer all know.

## What counts as correct

The scenario knows each fixture's format and accepts the names that
the registry or the libraries' own tables give for it. A wrong or missing type
fails, and so does a constant answer or `application/octet-stream`. Accepted
differences, all naming only:

- Parameters after `;` are ignored (`marcel` answers
  `application/x-rar-compressed;version=5`).
- `application/gzip` and `application/x-gzip`.
- `audio/wav`, `audio/x-wav`, `audio/wave`, `audio/vnd.wave` (Go answers
  `audio/wave`).
- `application/vnd.rar`, `application/x-rar-compressed`, `application/x-rar`.
- `image/bmp` and `image/x-ms-bmp`.
- `audio/ogg`, `application/ogg`, `video/ogg`.

No unknown-format fixtures are included: what a library answers for data it
does not know (null, an exception, `application/octet-stream`, `text/plain`)
differs between libraries and is not the job measured here.

## Same work in every language

Every adapter passes the bytes to the library's documented one-call function
with default options and returns what it returns, a string or nothing.
Ruby gives `marcel` a `StringIO` over the bytes inside the call (its documented
input is an IO). `puremagic` signals "no match" with an exception; the adapter
returns None for it. Rust returns `Option<&str>` and converts to JSON in
`describe`, outside the measured work.

## Packages

- Rust: `infer` `get(...).mime_type()`.
- PyPI: `filetype` `guess_mime`, `puremagic` `from_string(..., mime=True)`.
- RubyGems: `marcel` `Marcel::MimeType.for`.
- Standard library: Go `net/http` `DetectContentType` (reads the first 512
  bytes only, which every fixture's header fits in).

`puremagic` is recorded as not passing (see its entry): it answers OOXML for
every plain ZIP, `audio/vnd.audiokoz` for ID3v2.3 and nothing for WebAssembly.

Left out: `file-type` (npm) only has an asynchronous API; `python-magic` and
`mimemagic` need the system's libmagic and shared-mime-info database (the
latter's install failed without it); `magika` is a deep-learning model;
`identify` reads files and file names (and shebangs), not a buffer. Python,
Ruby and JavaScript have no standard-library content sniffer.
See [shared methodology](../../README.md) for timing and reproduction.
