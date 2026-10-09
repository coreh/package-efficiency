# Write pages

One operation is given a document of 20 A4 pages (595.28 by 841.89 points) as
plain data and writes it as a PDF file, returned as bytes (base64 text from
Rust, Go, Python and Ruby, for the verifier only). A page is a list of texts,
each `{ x, y, text }` drawn in the standard Helvetica font at 10 points with
its baseline starting at `(x, y)`, and a list of rules `[x1, y1, x2, y2]`,
straight lines to stroke. Coordinates are points from the top-left corner of
the page, y downward; libraries that measure from the bottom-left corner are
given `841.89 - y`.

The 4 documents have 52, 76, 95 and 78 texts per page: a heading and 21 to 39
lines of 5 to 12 words, then the cells of a ruled table of 8 by 3 to 14 by 4
cells (13 to 20 rules). Lines come already broken and positioned, because line
breaking and layout differ between libraries and are not this task. The words
include what a PDF writer must escape or encode: parentheses, a backslash,
quotes, `&`, `<`, `%`, and Latin-1 letters (`café`, `Ångström`). No font is
embedded.

## What counts as correct

No two libraries write the same bytes, so the verifier reads each file with a
PDF reader of its own: the header and `%%EOF`, every indirect object (and
those packed in object streams), stream data delimited by `/Length` (direct or
indirect; without a usable `/Length`, up to `endstream` less one end-of-line
marker, as the specification puts it), the Flate and ASCII85 filters, the page
tree from the catalog with inherited `/MediaBox`, and the text and path
operators of each page's content streams. It checks:

- the number of pages, in order;
- each page is A4 within a point;
- the strings shown on each page (`Tj`, `TJ`, `'` and `"`, kerning arrays
  joined, a new line at `BT`, `ET`, `Td`, `TD`, `Tm` or `T*`), decoded as
  WinAnsi, are the page's texts exactly and in order;
- each page draws at least as many line segments as it has rules, and strokes
  something.

The scenario writes a minimal PDF of its own and asserts at load that it
passes, with and without compression, with CRLF markers, with an indirect
`/Length` and with none; and that a missing line, a missing page, swapped
pages, Letter size, a page without its rules, another document's text, a
truncated file and non-PDF input all fail.

Not compared: where each text is placed, the font resource's name, line
widths, colours, metadata, the cross-reference format and whether streams are
compressed. Some entries compress their content streams by default and some do
not; each runs with its default, so the figures include compression for
`fpdf2`, `gofpdf`, `printpdf` and `reportlab` (which also ASCII85-encodes
them), and not for `jspdf` and `prawn`.

## Packages

- `jspdf`: `new jsPDF({ unit: 'pt', format: 'a4' })`, `setFont('helvetica')`,
  `setFontSize(10)`, `text` and `line` per item, `addPage()`,
  `output('arraybuffer')`.
- `printpdf` (Rust): one `PdfPage` of operations per page (`SetFont` with the
  built-in Helvetica, then per text a text section with `SetTextCursor` and
  `ShowText`, a `DrawLine` per rule), `PdfDocument::with_pages(...).save`
  with the default options. Built without its default feature, the HTML
  layout engine, which the task does not use.
- `reportlab` (PyPI): `canvas.Canvas(buffer, pagesize=A4)`, `setFont`,
  `drawString`, `line`, `showPage()`, `save()`.
- `fpdf2` (PyPI): `FPDF(unit='pt', format='A4')`, `set_font`, `add_page()`,
  `text`, `line`, `output()`.
- `prawn` (RubyGems): `Prawn::Document.new(page_size: 'A4', margin: 0)`,
  `font('Helvetica', size: 10)`, `draw_text`, `stroke_line`,
  `start_new_page`, `render`.
- `jung-kurt/gofpdf` (Go): `gofpdf.New("P", "pt", "A4", "")`, `SetFont`,
  `AddPage()`, `Text`, `Line`, `Output`. Its core fonts take cp1252 bytes, so
  each text goes through `UnicodeTranslatorFromDescriptor("")`, made once per
  document. The module is archived; its last release is used.

`reportlab` and `fpdf2` need Pillow, which has no pure-Python wheel, so they
run on CPython only. No standard library writes PDF, so there are no built-in
entries.

Left out: `pdfkit`, `pdf-lib` and `pdfmake` (npm) produce the file
asynchronously and wait for the asynchronous task kind. `weasyprint` (PyPI)
and `wicked_pdf` (RubyGems) turn HTML into PDF, another job, and `wicked_pdf`
runs an external program. `pydyf` (PyPI) writes PDF objects with no text or
page layout of its own, and `combine_pdf` (RubyGems) is for reading and
combining existing files. `prawn-table` is a table layout plug-in for Prawn,
whose writing is already the `prawn` entry.

See [shared methodology](../../README.md) for timing and reproduction.
