# Domain mapping to ASCII

One operation takes a domain name as a user might type or paste it and returns
a single string: the normalized ASCII form (lowercase, Punycode `xn--` labels
for non-ASCII labels). This is the UTS #46 / IDNA mapping job, where the
existing round-trip task only handled already normalized names.

The 60 inputs start from valid names with Latin (with diacritics), Greek,
Cyrillic, Han, Kana, Hangul, Thai, Devanagari and Arabic labels and are then
written in one of six ways: UPPERCASE, decomposed (NFD) accents, fullwidth ASCII
letters, ideographic full stops (U+3002) as label separators, a combination of
those, or a soft hyphen inside a label (ignored by the mapping). Every input is
different from the expected output. A correct output equals the independent
RFC 3492 encoding of the lowercase, NFC form of the name, so a package that
returns its input, only encodes Punycode, or skips mapping fails.

The `punycode` npm package is left out: it converts labels but does no mapping
or normalization, so it cannot do this job. Inputs avoid cases where IDNA 2003,
IDNA 2008 and UTS #46 disagree (`ß`, final sigma, emoji), so `tr46`, `idna`,
Node's WHATWG URL are accepted as equivalent.
Public suffix lookup and URL parsing are out of scope. Packages run with their
default settings as installed.

Python's `idna` codec is left out: it leaves ASCII labels untouched (no case
folding), so it would not lowercase `EXAMPLE.COM`.
