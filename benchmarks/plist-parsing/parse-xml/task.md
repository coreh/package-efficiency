# Parse an XML property list

One operation parses an XML property list (text of 1.7 to 57 KB, 55 to 2,100
elements) into the library's native values. The 24 documents are generated
deterministically, in the form Apple's tools write: the `DOCTYPE`, tab
indentation, `<dict/>` and `<array/>` for empty containers, and data as base64
wrapped over several lines. Each has a top-level dictionary with a few
settings, an icon (data) and an `Items` array of 1 to 60 entries; an entry has
strings with `&amp;`, `&lt;`, quotes and non-ASCII text (accented, Japanese,
a check mark), an empty string, integers (negative, above 2^32, below -2^31),
reals, booleans, a date, a thumbnail (data), a list of strings, and a nested
dictionary with a list of mixed numbers and an empty container.

## What counts as correct

The verifier knows the value the generator wrote and compares the library's
result with it, strictly: same keys, same list lengths, same strings, same
numbers, booleans as booleans, numbers as numbers (not text). A date must be the
right instant and data the right bytes; both are read into one common shape
before comparing:

- a date is `{ date: seconds since the epoch }`; it is accepted as a JavaScript
  `Date`, or as ISO 8601 text with a time zone in the JSON an adapter's
  `describe` writes (Python `datetime`, Ruby `DateTime` or `Time`, Go
  `time.Time`, Rust `plist::Date`). A date shifted by an hour fails;
- data is `{ data: bytes }`; it is accepted as a `Buffer` or any typed array,
  or as strict base64 text in a `{ "$data": ... }` object (Python `bytes`,
  Ruby `StringIO` or `CFPropertyList::Blob`, Go `[]byte`, Rust `Vec<u8>`).
  Base64 text that was never decoded (the library returned the element's text)
  does not pass.

Integer and real are not told apart (JavaScript has one number type; the
generator's reals all have a fraction and its integers none, so a library that
returns text for either still fails). The order of a dictionary's keys is not
compared. The scenario proves at load that its check fails for the input text,
a date left as text, data left as text, a number as text, a missing entry, a
boolean as text and a date an hour out.

Left out of the documents because the libraries differ and the format leaves
it open: white space at the start or end of a string, a `<string/>` written as
an empty element, comments, `<integer>` values beyond 2^53, and the binary and
ASCII forms. Only the XML form is measured.

## What is timed

The call parses the text and returns the library's own result: nothing is
walked, converted or hashed inside it. The mapping of dates and data to the
common shape is `describe` in Python and Ruby, `describe_value` in Rust and a
JSON-writing method on the result in Go, all run once per fixture before any
measured work; in JavaScript the verifier does it. Libraries that take bytes
(Python `plistlib`, the Go modules) are given the text encoded to bytes in
`prepare`, which is not timed; libraries that take text are given the text.
The XML libraries differ in how much work they do: `plist` and `@expo/plist`
build a DOM first, `fast-plist` and the Go and Rust parsers read tokens; this
is each library's normal way and is measured as it is.

## Packages

Each runs with default options, the way its documentation shows.

- `plist` (npm): `parse(xml)`.
- `@expo/plist`: `plist.parse(xml)`, a fork of `plist`.
- `simple-plist`: `parse(xml)`; it checks for the binary form, then hands the
  XML to `plist`.
- `fast-plist`: `parse(xml)`. Not passing: it returns a `<data>` element as the
  base64 text with its tabs and line breaks, not as bytes; everything else
  (dates, numbers, text) is right.
- `plist` (crates.io): `Value::from_reader` on the bytes.
- `plistlib` (Python standard library): `loads(bytes)`.
- `plist` and `CFPropertyList` (RubyGems): `Plist.parse_xml(xml)`;
  `CFPropertyList.native_types(List.new(data: xml).value)`.
- `howett.net/plist` and `github.com/micromdm/plist` (Go): `Unmarshal` into an
  empty interface.

Not included: Ruby `nanaimo` and Go `groob/plist` (an older name of
`micromdm/plist`, which Go refuses to build under the old path). `nanaimo`
reads ASCII property lists, another format. PyPI `biplist` publishes only a
source distribution, which the install rules do not accept; no PyPI package with a wheel that reads XML plists was found. JavaScript, Ruby and Go have no
standard-library reader, and JSR has no package for it.

See [shared methodology](../../README.md) for timing and reproduction.
