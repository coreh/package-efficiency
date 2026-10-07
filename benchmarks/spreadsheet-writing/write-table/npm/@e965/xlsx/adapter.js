import * as XLSX from '@e965/xlsx'
export const operation = ({ sheets }) => {
  const wb = XLSX.utils.book_new()
  for (const { name, rows } of sheets) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name)
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}
