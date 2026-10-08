# Extract page text

One operation takes a small PDF file held in memory and returns the text of
each page, as a list of strings in page order. Fixtures are shared as JSON, so
each file is a lowercase hex string; every adapter turns it into bytes once per
fixture, before any measured work. Opening the document, parsing its page tree,
decoding the content streams and extracting the text are all inside the timed
call.

The 8 files are written by the scenario: 1 to 12 pages (36 to 4,600 words) of
single-column text in one standard font (Helvetica, Times-Roman or Courier,
WinAnsi, not embedded), shown with `Tj`, with a `TJ` array that has a small
kerning gap after the first word of a line, or with the `'` operator. Some
content streams are Flate-compressed. The words are ASCII, with a few digits
and punctuation (`1,250.00`, `A/B`, `item-12`).

## What counts as correct

Libraries disagree about line breaks, spacing, the order of end-of-line
characters and a trailing form feed. The verifier therefore splits each page's
text on any white space and requires the words to equal, exactly and in order,
the words the scenario drew on that page. The list must have one string per
page. Accepted differences, all white space: `\n` or `\r\n` between lines or a
space instead, trailing blank lines, a form feed at the end. Not accepted: a
missing, merged, split, reordered or misspelled word, pages merged into one
string or in another order, or an empty page. The scenario asserts at load that
empty text, merged pages, swapped pages and a dropped word are all rejected.

## Packages

Each runs with its default options. Where a library returns the pages as an
object, the adapter maps them to a list of strings inside the call.

- `pypdf`: `PdfReader(BytesIO(bytes)).pages`, `page.extract_text()`.
- `pymupdf`: `pymupdf.open(stream=bytes, filetype='pdf')`, `page.get_text()`
  for each page. A compiled extension (MuPDF).
- `pypdfium2`: `PdfDocument(bytes)`, `page.get_textpage().get_text_range()`.
  A compiled extension (PDFium).
- `pdfplumber`: `pdfplumber.open(BytesIO(bytes))`, `page.extract_text()`.
  Built on pdfminer.six.
- `pdf-reader` (RubyGems): `PDF::Reader.new(StringIO.new(bytes)).pages.map(&:text)`.
- `rsc.io/pdf` (Go): `NewReader`, `Page(i).Content().Text`, strings
  concatenated per page. Not passing: the library returns one positioned run
  per glyph and no space characters, so the words of a line run together.
  Putting spaces back means judging the gaps between glyph positions, which is
  layout analysis the library does not offer, so no such variant is entered.

Not included: the npm and JSR packages (`pdfjs-dist`, `@lino/pdf-parse`,
`@pdf/pdftext`) read PDFs through pdf.js, which is asynchronous, and wait for
the asynchronous task kind. `pypdf2` is the old name of `pypdf`, a deprecated
copy of the same code; `pymupdf-layout` is a layout-analysis add-on to
`pymupdf`, not a reader of its own. No standard library reads PDF files, so
there are no builtin adapters. No crate is entered: the brief lists none.

PDF files that have text as images, forms, encryption, embedded fonts or several
columns are not covered; there the libraries differ in reading order, which no
loose comparison can accept fairly.

See [shared methodology](../../README.md) for timing and reproduction.
