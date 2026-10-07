# Basic HTML entity unescaping

One operation decodes a string containing HTML entities back to text. The 65
cases are escaped HTML snippets, attribute values, already double-escaped text
(`&amp;lt;` must decode once to `&lt;`), bare ampersands (`R&D`), Unicode text,
dense runs of entities, varied lengths and the empty string.

Only the entities every package in the task agrees on appear in the inputs:
`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`, `&#39;` and `&#34;`, always with the
terminating semicolon. Outputs must equal an independent single-pass replacement
oracle exactly, so returning the input or decoding more than once fails.

Left out: `decode-named-character-reference` (decodes one named reference, not a
string) and `micromark-util-encode` / `escape-html` / askama_escape (escape only).
The full-HTML decoders (`entities` decodeHTML, Python `html.unescape`, Go
`html.UnescapeString`) do more work than the minimal decoders; that is part of
what is measured, because it is what each default function does. Packages run
with default settings as installed. Inputs are preconstructed in memory.

Entries: npm `entities` (`decodeHTML`), npm `html-escaper` (`unescape`), JSR
`@std/html` (`unescape`), Rust `html-escape` (`decode_html_entities`, returned as
Cow), Python `html.unescape`, Ruby `CGI.unescapeHTML`, Go `html.UnescapeString`.

Rust `htmlescape` `decode_html` was left out: it returns an error on bare ampersands (`R&D`), so it cannot do the common job.
