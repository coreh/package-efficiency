import { Buffer } from 'node:buffer'
import * as XLSX from 'xlsx'
// Not timed: runs once per fixture.
export const prepare = (hex) => Buffer.from(hex, 'hex')
export const operation = (bytes) => {
  const book = XLSX.read(bytes, { type: 'buffer' })
  return book.SheetNames.map((name) => ({ name, rows: XLSX.utils.sheet_to_json(book.Sheets[name], { header: 1 }) }))
}
