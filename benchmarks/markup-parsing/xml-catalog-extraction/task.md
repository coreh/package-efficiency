# XML catalog extraction

The first markup task (XHTML content summary) reads everything in a document
that is valid as both HTML and XML. This one is the other common job: take a
data-style XML document, as a feed or export would be, and extract specific
values by element and attribute name.

One operation takes the text of one product catalog and returns
`{ products, inStock, cents, tags, descriptionChars }`:

- `products`: the number of `product` elements.
- `inStock`: how many `product` elements have the attribute `stock="true"`.
- `cents`: the sum of the integer text of all `price` elements.
- `tags`: the number of `tag` elements.
- `descriptionChars`: the number of Unicode code points other than space (U+0020),
  tab, line feed and carriage return in the decoded character data of all
  `description` elements. CDATA sections count, with their content as written.

A `description` holds entity-escaped text, a CDATA section and more text, for
example `café crème <![CDATA[<b>bold</b> & more]]> dash — dash`, and a `price`
holds digits only. Whitespace is left out of the count because parsers
legitimately differ on it: some trim each text piece, which drops the spaces
around a CDATA section. Everything else must agree, so a parser that leaves
`&amp;` undecoded, drops CDATA or reads it as a comment gives the wrong figure.

The 36 documents are generated deterministically: an XML declaration, a
comment, a `catalog` root with single-quoted attributes, two to four
`category` elements, each with products (`sku` and `stock` attributes quoted
with either quote style, `name`, `price` with a `currency` attribute, one to
four `tag` elements inside `tags`, a `description` and a comment). Sizes run
from one product (under 0.5 KB) to about 145 products (about 47 KB). Names and
descriptions include `&`, `<`, `>`, quotes, accented text, Japanese text and an
emoji. The expected figures come from the generator, summed from the decoded
strings as the markup is written, not from any parser.

## What is measured

Parsing, and reading the named elements and attributes through the library's
ordinary API, inside the measured call. Event parsers (`sax`, `saxes`,
`sax-ts`, `htmlparser2`, `quick-xml`, `xml-rs`, Go `encoding/xml`) keep a
small state (inside `price` or inside `description`) and add up in their
handlers. Tree and object parsers (`fast-xml-parser`, `@std/xml`, `roxmltree`,
Python `ElementTree`) build their result and the adapter looks up the products
in it. Parser objects are created fresh per call, as the documentation shows;
there is no schema or pattern to compile.

Packages run with default settings as installed, with two stated exceptions
that are variants: `htmlparser2` defaults to HTML mode, where CDATA is a
comment, so its default entry fails the check and the `xmlMode` variant does
the job; `fast-xml-parser` drops attributes by default, so its default entry
fails and the variant with `ignoreAttributes: false` does the job. Under the
default `parseTagValue`, `fast-xml-parser` returns price text as a number and
the adapter passes it through `Number()`.

## Accepted differences

- Event parsers never hold the whole document; tree parsers do, and their
  memory figure includes the tree.
- `quick-xml` reports a reference in text as its own event, which the adapter
  resolves with the crate's own functions; it borrows text where no decoding is
  needed.
- Languages return the same five integers; Rust, Go and Python count code points
  natively and JavaScript adapters subtract the second half of each surrogate pair.

## Left out

- `parse5`, `html5ever` and `@b-fuze/deno-dom` are HTML5 parsers: they read the
  XML declaration as a bogus comment and CDATA as a comment, so they cannot
  deliver this data and are not asked to.
- `xmlparser` (cargo) yields raw slices and does not resolve references; the
  adapter would have to implement decoding itself.
- `@libs/xml`, `@mikaelporttila/rss`, `@sftsrv/structured-html` and
  `@bureaudouble/html-parse-stringify` were not written: the first was not
  tried for time, the others are feed or HTML-shaped and do not offer a plain
  generic XML parse.

This is parsing, not DOM manipulation, serialization or sanitizing. Documents
are preconstructed in memory.
