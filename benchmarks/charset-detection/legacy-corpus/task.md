# Legacy encoding corpus

One operation takes a byte buffer of text in an unknown encoding and returns
the name of the encoding the library guesses. The 51 fixtures are 200 bytes to
4 KB of ordinary prose in: Shift_JIS, EUC-JP, EUC-KR, GBK, GB18030, Big5,
windows-1251, KOI8-R, windows-1253, windows-1255 and windows-1252 (French,
German, Spanish), plus UTF-8 text in eight languages and a mixed-script sample.
The legacy bytes are made in the scenario by inverting the platform's WHATWG
decoder tables.

Fixtures are shared as JSON, so each buffer is a lowercase hex string. Every
adapter turns it into bytes once per fixture, before any measured work, so the
measured call is the detection alone. The result is the library's own name for
the encoding; no adapter normalizes names inside the call.

A correct answer is one that reads the bytes as the original text: the
verifier decodes the buffer with the encoding the library named (through the
WHATWG decoder, which knows the common aliases) and compares the result with
the text the fixture was made from. So GB2312, GBK and GB18030 are all accepted
for Chinese text, ISO-8859-1 or ISO-8859-9 for windows-1252 text that uses no
character where they differ, and KOI8-U for Russian text in KOI8-R. An encoding
that reads the bytes as different text (EUC-JP detected as GBK), an unknown
name, or no answer fails. Pure ASCII, UTF-16 and ambiguous short samples are
left out: libraries differ in what they report and nothing is wrong with either.

Packages run with their default settings as installed.

## Left out

- `html-encoding-sniffer` (npm) does not guess: it reads a BOM, a transport
  label or a `<meta>` declaration, and otherwise falls back to a fixed default.
- PyPI, RubyGems and Go packages (charset-normalizer, chardet, cchardet,
  rchardet, charlock_holmes) cannot be synchronous-task adapters yet.
- No JavaScript, Python, Ruby or Go standard library detects encodings.
