import { Buffer } from 'node:buffer'
import { read, utils } from '@mirror/xlsx'
// Not timed: runs once per fixture.
export const prepare = (hex) => Buffer.from(hex, 'hex')
export const operation = (bytes) => {
  const book = read(bytes, { type: 'buffer' })
  return book.SheetNames.map((name) => ({ name, rows: utils.sheet_to_json(book.Sheets[name], { header: 1 }) }))
}
