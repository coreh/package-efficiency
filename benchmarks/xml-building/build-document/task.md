# Build and serialize a document

One operation is given an element tree as plain data, builds the document with
the library and returns it as XML text. A tree node is `{ name, attrs, text }`
for an element with character data or `{ name, attrs, children }` for an
element with child elements; `attrs` maps attribute names to string values.
No element has both text and children.

The 24 documents are product catalogs of 23 to 800 elements (1.5 to 53 kB of
XML), built deterministically. Every element has three attributes. Text and
attribute values include `&`, `<`, `>`, both quotes, `]]>`, leading and
trailing spaces, empty strings, accented and Japanese text; text also includes
a tab.

## What counts as correct

Two writers rarely produce the same bytes for the same document, and the
differences are style: an XML declaration or none, `<a/>` or `<a></a>`, single
or double quotes around attribute values, `&quot;` or `&#34;`, `&#x9;` or a
literal tab in text, a character reference or the character itself for
non-ASCII text, the order of an element's attributes, and line breaks and
indentation between elements. None of that is compared.

The verifier reads each output with a small strict XML reader (it rejects
anything that is not well formed) into names, attribute values and character
data, with entities and character references resolved, and compares that with
the input tree: the same elements in the same order, the same attributes as a
set, and exactly the same text in every text element, spaces included. White
space between the children of an element that has only child elements is
ignored. So an unescaped `&` or `<`, a lost or doubled attribute, trimmed or
indented text, or an element out of order fails.

Left out of the fixtures: a tab or line break inside an attribute value. An
XML parser turns a literal one into a space, so a writer must emit `&#9;` or
`&#10;`. `xmlbuilder`, `quick-xml`, Python and Go do; `xmlbuilder2`,
`fast-xml-parser`, REXML and `xml-rs` write it literally and the character is
lost on reading. That is a real difference in correctness, but with it in the
fixtures half the entries would have no figures and no setting that fixes it,
so it is stated here instead.

## Packages

Every adapter walks the input tree once and makes the calls its library's
documentation shows, with default options, then asks for the text. A library
that takes nested data instead of builder calls is given that data, built from
the tree inside the timed call; that is its walk.

- `xmlbuilder`: `create(name)`, `ele(name, attributes, text)`, `end()`.
- `xmlbuilder2`: `create()`, `ele(name, attributes)`, `txt(text)`, `end()`.
- `fast-xml-parser`: `new XMLBuilder().build(object)`. With default options the
  builder ignores attributes (it writes `@_id` keys as elements), so the
  default entry is recorded as not passing; the variant
  `fast-xml-parser-attributes` passes `{ ignoreAttributes: false }`.
- `quick-xml` (Rust): a `Writer` and `Start`, `Text`, `End` events.
- `xml-rs` (Rust): an `EventWriter` and `start_element`, `characters`,
  `end_element` events.
- Standard library: Python `xml.etree.ElementTree` (`SubElement`, `tostring`),
  Go `encoding/xml` (`Encoder.EncodeToken`), Ruby REXML (`add_element`,
  `add_text`, `Document#write`; a bundled gem that ships with Ruby).

The libraries do not all work the same way, and that is part of what is
measured: `xmlbuilder`, `xmlbuilder2`, ElementTree and REXML build a document
object in memory and then serialize it; the Rust crates and Go write each
element straight into the output buffer.

Not included yet: RubyGems `builder` and `gyoku` and PyPI `et-xmlfile`, which
can be added when those registries can supply adapters. `arbre` builds HTML.

See [shared methodology](../../README.md) for timing and reproduction.
