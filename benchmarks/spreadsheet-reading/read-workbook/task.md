# Read an XLSX workbook

One operation takes an XLSX workbook held in memory as bytes, opens it with the
library and reads every cell of every sheet. The result is a list of sheets in
workbook order, each `{ name, rows }`, where `rows` is a list of rows and each
row a list of cell values. Fixtures are shared as JSON, so each workbook is a
lowercase hex string; every adapter turns it into bytes (or a stream over the
bytes) once per fixture, before any measured work. Opening the workbook,
parsing the XML and mapping to the common shape are all in the timed call.

The 3 workbooks are written by the scenario itself (a zip with deflate, the
workbook, styles, a shared string table and one worksheet part per sheet), so
the expected values are known without a spreadsheet library. They hold 3 or 4
sheets of 1 to 400 rows and 4 to 10 columns: 600 to 12,000 cells per sheet and
about 5 KB to 60 KB compressed. Sheet names include a space, `&`, `<` and
non-ASCII text. Cells are shared strings (accents, CJK, `&`, `<`, quotes),
whole numbers (also negative), decimals of up to six places (some needing 16
digits to round-trip) and booleans. Every row has the same number of cells and
none is empty; blank cells, formulas, dates and the legacy `.xls` format are not
covered (libraries differ widely on dates and on how they report empty cells).

## What counts as correct

The verifier compares the sheet count, every sheet name, the number of rows and
the number of cells of every row, and then every cell:

- a string cell must be a string, exactly equal;
- a number must be equal to the number written (a whole number may come back
  as an integer or a float);
- a boolean must be `true`/`false`.

Accepted as the same answer in another spelling: a library that only hands out
the text of a cell may give a number as its decimal text (`"12.5"`, with every
digit that was stored), and a library with no boolean type may give a boolean
as its stored `1`/`0` (number or text) or as `TRUE`/`FALSE`. Nothing else is
forgiven: a rounded number, a missing sheet, row or cell, or a text cell that
is not exactly the stored text fails. The scenario asserts at load that an
empty answer, names alone, truncated rows and text-only strings are rejected.

## Packages

Each runs with its default options, reading from memory.

- npm `xlsx` (SheetJS, the last release on npm): `XLSX.read(bytes, { type:
  'buffer' })` and `sheet_to_json(sheet, { header: 1 })`. The same library is
  `@mirror/xlsx` on JSR. `node-xlsx`: `parse(bytes)`, a wrapper around it.
- Rust `calamine`: `open_workbook_from_rs` and `worksheets()`; typed cells.
  `umya-spreadsheet`: `read_reader` and `get_value` per cell; text values.
- Python `openpyxl`: `load_workbook(BytesIO)` and `iter_rows(values_only=True)`
  (a full, non-read-only load). `python-calamine`: `from_filelike` and
  `to_python()`; its wheels hold compiled code, so it has no PyPy run.
- Ruby `roo`: `Roo::Excelx.new(StringIO)` and `sheet(name).to_a`. `rubyXL`:
  `RubyXL::Parser.parse_buffer` and `cell.value` (booleans come back as 1/0).
- Go `xuri/excelize`: `OpenReader` and `GetRows`. Not passing by default: the
  General number format prints 15 significant digits, so some numbers come back
  changed; the `-raw` variant sets `Options{RawCellValue: true}`. `tealeg/xlsx`:
  `OpenBinary`, cells via `Value`. `thedatashed/xlsxreader`: `NewReader` and
  `ReadRows` (streaming, text values).

Libraries differ in what they do beyond reading: openpyxl builds a full object
model with styles, calamine and SheetJS parse values only. Both are the
library's normal way of opening a workbook and are measured as they are.

## Left out

- No standard library reads XLSX in JavaScript, Python, Ruby or Go (they
  have a zip reader and an XML parser, but the job would be written by hand),
  so there are no builtin entries.
- npm `exceljs` and `read-excel-file`, and `xlsx-populate`, read through
  promises only; they wait for the asynchronous task kind.
- PyPI `xlrd` (2.0 and later) reads only the legacy `.xls` format, as does
  RubyGems `spreadsheet`; neither can open an XLSX. `pandas` and `polars` are
  dataframes, another job.
- Ruby `creek` and `simple_xlsx_reader` were not entered because of the limit
  of entries per registry.

See [shared methodology](../../README.md) for timing and reproduction.
