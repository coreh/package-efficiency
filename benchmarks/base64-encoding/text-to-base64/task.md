# Text to base64

One operation takes a string and returns the base64 text of its UTF-8 bytes,
using the standard RFC 4648 alphabet (`+` and `/`) with `=` padding and no line
breaks. The 43 cases are 32-character identifier-like values (the "32-byte
value" size), short words of every length modulo 3 (so every padding shape
occurs), Unicode text, JSON-like documents and longer prose up to a few
kilobytes, plus empty text.

The output must equal the reference encoding exactly. No equivalences are
accepted: the alphabet, padding and absence of line breaks are part of the
contract. Decoding is not measured, and neither are URL-safe or other alphabets.

The input is a string, because fixtures are shared with the Rust runner as JSON.
Every adapter therefore does the same two steps inside the measured call: turn
the string into UTF-8 bytes, then encode them. JavaScript adapters whose package
takes bytes call a shared module-level `TextEncoder`; packages and built-ins that
accept a string (and encode it as UTF-8 themselves) are called with the string.
Rust adapters use `str::as_bytes()`, which is free. Packages run with default
settings as installed, with no cached results between calls.
