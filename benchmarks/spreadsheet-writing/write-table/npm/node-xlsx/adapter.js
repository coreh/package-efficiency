import xlsx from 'node-xlsx'
export const operation = ({ sheets }) => xlsx.build(sheets.map(({ name, rows }) => ({ name, data: rows })))
