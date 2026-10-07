import { Buffer } from 'node:buffer'
import xlsx from 'node-xlsx'
// Not timed: runs once per fixture.
export const prepare = (hex) => Buffer.from(hex, 'hex')
export const operation = (bytes) => xlsx.parse(bytes).map(({ name, data }) => ({ name, rows: data }))
