import cliui from 'cliui'
export const operation = ({ headers, rows }) => {
  const table = [headers, ...rows].map((r) => r.map(String))
  const widths = headers.map((_, c) => table.reduce((m, r) => Math.max(m, r[c].length), 0) + 1)
  const ui = cliui({ width: widths.reduce((a, b) => a + b, 0) })
  for (const r of table) ui.div(...r.map((text, c) => ({ text, width: widths[c] })))
  return ui.toString()
}
