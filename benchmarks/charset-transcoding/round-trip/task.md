# Legacy character set round trip

One operation takes an encoding label (`shift_jis`, `gbk` or `windows-1252`) and
a Unicode string. The adapter encodes the string to bytes in that encoding, then
decodes those bytes back to text, and returns the pair `[byteLength, text]`
(a list in Python and Ruby, an array in JavaScript, a tuple described as a
two-element JSON array in Rust). Both halves are inside the measured call.

The 66 cases mix Japanese (hiragana, katakana, kanji, full-width punctuation),
simplified Chinese, and Western European text (accents, euro sign, curly quotes,
dashes) with ASCII, in lengths from a few characters to about 1,500, plus empty
text. Every non-ASCII character is chosen from the common core that Shift_JIS,
GBK and windows-1252 all agree on across implementations, so the expected
answer is unambiguous. A correct output has the text equal to the input and a
byte length equal to an independently computed value (1 byte per ASCII
character, 2 per Shift_JIS or GBK non-ASCII character, 1 per windows-1252
character). A function that returns its input without encoding fails the byte
length check; one that mangles characters fails the text check.

Packages run with their default settings as installed. Unmappable characters
do not occur in the inputs, so error and replacement behaviour is not compared.
Detection of unknown encodings, BOM handling, base64 and UTF-8 validation alone
are out of scope. Encoders that are not part of the WHATWG Encoding Standard
(Python, Ruby, iconv-lite) and encoding_rs, which implements it, are accepted as
equivalent here because the inputs avoid the characters on which they differ.

## Entries

- `iconv-lite`: `iconv.encode(text, label)` then `iconv.decode(bytes, label)`.
- `encoding_rs`: `Encoding::encode` then `decode_without_bom_handling`, with the
  result copied into an owned `String`. The encoding is resolved from the label
  with `Encoding::for_label` in every call, the library's own lookup, as the
  other entries resolve it through theirs.
- Python `str.encode` / `bytes.decode`, Ruby `String#encode`: standard library.
- `whatwg-encoding` is left out: it decodes only, and the Encoding Standard
  defines no encoder for these legacy encodings. Go has no standard-library
  support for them, and a JavaScript built-in (`TextDecoder`) cannot encode.
