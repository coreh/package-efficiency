# Read a legacy .xls workbook

One operation takes a legacy `.xls` workbook (BIFF8, the Excel 97 to 2003
format) held in memory as bytes, opens it with the library and reads every
cell of every sheet. The result is a list of sheets in workbook order, each
`{ name, rows }`, where `rows` is a list of rows and each row a list of cell
values. Fixtures are shared as JSON, so each workbook is a lowercase hex
string; every adapter turns it into bytes (or a stream over the bytes) once per
fixture, before any measured work. Opening the compound file, parsing the
records and mapping to the common shape are all in the timed call.

The 3 workbooks are written by the scenario itself, so the expected values are
known without a spreadsheet library: an OLE compound file (version 3, 512-byte
sectors) holding one `Workbook` stream, and in it the BIFF8 globals (BOF,
CODEPAGE 1200, WINDOW1, DATEMODE 0, fonts, 17 XF records, STYLE, one BOUNDSHEET
per sheet, the shared string table, EOF), then each sheet (BOF, DIMENSIONS,
ROW records and cells in blocks of 32 rows as Excel writes them, WINDOW2,
EOF). Strings are LABELSST cells; whole numbers that fit are RK cells, other
numbers NUMBER cells; booleans are BOOLERR cells; dates are RK cells with the
built-in date format 14. The shared string table runs over many CONTINUE
records, and strings of both encodings (Latin-1 and UTF-16) are split across a
record boundary, which the scenario asserts at load. The workbooks hold 3 or 4
sheets of 3 to 400 rows and 5 to 10 columns, 448 to 8,200 cells, about 12 KB
to 260 KB. Sheet names include a space, `&`, `<` and non-ASCII text. Cells are
strings (accents, CJK, Greek, an emoji, `&`, `<`, quotes, strings of over 255
characters), whole numbers (also negative, and some beyond the RK range),
decimals (some needing 17 digits to round-trip), booleans and whole-day dates
between 2000 and 2032. Every row has the same number of cells and none is
empty; blank cells, formulas, merged cells, times of day, the 1904 date system
and older BIFF versions are not covered (libraries differ widely on how they
report empty cells, and formulas need a cached value of their own record).

## What counts as correct

The verifier compares the sheet count, every sheet name, the number of rows and
the number of cells of every row, and then every cell:

- a string cell must be a string, exactly equal;
- a number must be equal to the number written (a whole number may come back
  as an integer or a float);
- a boolean must be `true`/`false`;
- a date must be its serial number in the 1900 date system (`36526` is
  2000-01-01).

Accepted as the same answer in another spelling: a library that only hands out
the text of a cell may give a number as its decimal text (`"12.5"`, with every
digit that was stored), and a library with no boolean type may give a boolean
as its stored `1`/`0` (number or text) or as `TRUE`/`FALSE`. A library that
turns a date-formatted cell into a date may give the ISO date of the serial
(`2000-01-01`, also with `T00:00:00` or ` 00:00:00`); a Python or Ruby date
object is turned into that text by the adapter's `describe`, outside the timed
call. A date is stored as a number with a date format, so both are the same
cell. Nothing else is forgiven: a rounded number, a date one day off, a date in
a locale format such as `1/1/00`, a missing sheet, row or cell, or a text cell
that is not exactly the stored text fails. The scenario asserts at load that
an empty answer, names alone, truncated rows, text-only strings, numbers
rounded to 15 digits and dates one day off are rejected.

## Packages

Each runs with its default options, reading from memory.

- npm `xlsx` (SheetJS, the last release on npm): `XLSX.read(bytes, { type:
  'buffer' })` and `sheet_to_json(sheet, { header: 1 })`; dates come back as
  serials. The same library is `@mirror/xlsx` on JSR.
- Rust `calamine`: `open_workbook_from_rs::<Xls<_>, _>(Cursor)` and
  `worksheets()`; typed cells, a date as `Data::DateTime`, read back as its
  serial.
- Python `xlrd`: `open_workbook(file_contents=bytes)` and `sheet.row_values`
  per row (numbers and dates as floats, booleans as 1/0). `python-calamine`:
  `from_filelike(BytesIO)` and `to_python()` per sheet; dates come back as
  `datetime.date`. Its wheels hold compiled code, so it has no PyPy run.
- Ruby `spreadsheet`: `Spreadsheet.open(StringIO)` and each worksheet's rows;
  dates come back as `Date`.

The fixtures were read correctly by SheetJS 0.18.5 and python-calamine 0.8.2
when the task was written.

## Left out

- No standard library reads `.xls` in JavaScript, Python, Ruby or Go (they
  would need a compound-file reader and a BIFF parser written by hand), so
  there are no builtin entries.
- `node-xlsx` is a wrapper around SheetJS that adds nothing for `.xls`; it is
  in the XLSX task.
- `openpyxl`, `roo` (its `.xls` support is the separate `roo-xls` gem, which
  wraps `spreadsheet`), `rubyXL`, `umya-spreadsheet`, `excelize`,
  `tealeg/xlsx` and `xlsxreader` read only XLSX. `pandas` and `polars` are
  dataframes, another job, and read `.xls` through `xlrd` or `calamine`.
- npm `exceljs` and `read-excel-file` read XLSX only, through promises.

See [shared methodology](../../README.md) for timing and reproduction.
