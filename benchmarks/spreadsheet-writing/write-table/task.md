# Write a workbook

One operation takes a table held in memory and writes it as an XLSX workbook,
returned as the file's bytes. The input is JSON: a list of sheets, each with a
name and rows of cells; a cell is a text or a number. Every adapter walks the
input and hands each cell to the library (no preparation step), and returns what
the library returns: a buffer, a byte string or a byte array.

The 10 fixtures have 1 to 3 sheets of 6 to 251 rows by 3 to 8 columns, from a
fixed seed. The first row of each sheet is a header of texts. The cells are
integers, decimals with up to six places (negative too), and texts: plain,
Latin, Cyrillic and Japanese, emoji, XML special characters (`& < > " '`), a
120-character text, and texts that look like numbers or booleans (`007`, `1e5`,
`12.50`, `-5`, `TRUE`) and must stay texts. No cell is empty, a formula, a date,
a boolean or a text beginning or ending with a space, and no text begins with
`=` or looks like a link; those are where libraries differ in meaning, not in
speed.

## What counts as correct

The bytes of two libraries never match: shared or inline strings, compression
level, part order, styles and document properties all differ. None of that is
compared. The verifier reads each output with its own strict reader and checks
that

- it is a valid ZIP file: every entry's size and CRC-32 are right, and the
  parts it needs are there (`_rels/.rels`, the workbook, its relationships and
  each sheet);
- the sheet names are exactly the fixture's, in order;
- every cell has the expected type (text or number) and value, texts with
  entities resolved and in any of shared, inline or formula-result form; a
  number is read from its written form, so a library that rounds is caught;
- there are no cells beyond the fixture's, and no formulas.

Dropping a row, turning numbers into texts or texts that look like numbers into
numbers, renaming or dropping a sheet, and an empty ZIP all fail.

## Packages

Each runs with its default options and the library's documented way to build a
workbook from rows and write it to memory.

- npm `xlsx` (SheetJS), `xlsx-js-style`, `@e965/xlsx`: `aoa_to_sheet`,
  `book_append_sheet`, `write(wb, { type: 'buffer', bookType: 'xlsx' })`. The
  last two are forks of the first with the same API.
- npm `node-xlsx`: `build([{ name, data }])`.
- crates `rust_xlsxwriter` (`write_string`, `write_number`, `save_to_buffer`)
  and `umya-spreadsheet` (`set_value_string`, `set_value_number`,
  `writer::xlsx::write_writer`).
- PyPI `xlsxwriter` (`Workbook(BytesIO, {'in_memory': True})`, `write_row`) and
  `openpyxl` (`create_sheet`, `append`, `save(BytesIO)`).
- RubyGems `caxlsx`, `rubyXL` and `write_xlsx`. `caxlsx` and `write_xlsx` read a
  text such as `1e5` as a number unless told otherwise, so their adapters name
  the type of each cell (`types:`; `write_string` and `write_number`). That is
  the documented way to write typed data; the cost of choosing the type per
  cell is part of what is measured.
- Go modules `xuri/excelize` (`SetSheetRow`, `WriteToBuffer`) and `tealeg/xlsx`
  (`AddRow`, `AddCell`, `SetString`, `SetFloat`, `Write`).

What differs in the work done: `rust_xlsxwriter`, `xlsxwriter` and `write_xlsx`
write as they go or hold light cell records; `openpyxl`, `rubyXL`,
`umya-spreadsheet`, `excelize` and `tealeg/xlsx` build a full cell model first.
Compression levels and whether strings are shared also differ. Each is the
library's normal way and is measured as it is.

Not included: no standard library in JavaScript, Python, Ruby or Go writes
XLSX, so there is no `builtin` entry. `exceljs`, `xlsx-populate`,
`write-excel-file` and `excel4node` return their buffer through a promise or a
callback and wait for the asynchronous task kind. No JSR package writes XLSX.
`pandas` (a dataframe layer), `fast_excel` (writes to a file path only) and
`pyexcelerate` (file path only) are left out. The brief's whole-workbook
benchmark idea (5 sheets of 100,000 rows) is far larger than a repeated
cache-hot operation can use; this task keeps the same shape at a smaller size.

See [shared methodology](../../README.md) for timing and reproduction.
