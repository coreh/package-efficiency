# Domain name round trip

One operation takes a domain name written in Unicode and returns a list of two
strings: the ASCII (Punycode, `xn--`) form of the name, then the Unicode form
obtained by converting that ASCII form back. A correct result is
`[ascii, original]`.

The 59 inputs are lowercase, NFC-normalized, valid domain names: dotted names
with Latin letters with diacritics, Greek, Cyrillic, Han, Hiragana/Katakana,
Hangul, Thai, Devanagari and Arabic labels, mixed with plain ASCII labels and
all-ASCII names that must pass through unchanged. Outputs must equal an
independent RFC 3492 encoder's result.

Inputs avoid cases where IDNA2003, IDNA2008 and UTS #46 disagree (for example
`ß`, final sigma, emoji, uppercase letters needing case mapping). So packages
that apply UTS #46 mapping (`tr46`, `idna`, Node's WHATWG URL) and packages that
only do Punycode per label (`punycode`, Python's `idna` codec) are accepted as
equivalent. Packages return different shapes (a string, an object with an
error field, a tuple with a result); each adapter maps to the common
`[ascii, unicode]` list inside the call. Public suffix lookup and URL parsing are
out of scope. Packages run with their default settings as installed.
