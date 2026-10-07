import { Table } from '@sauber/table'
export const operation = ({ headers, rows }) => {
  const t = new Table()
  t.headers = headers.map(String)
  t.rows = rows.map((r) => r.map(String))
  return t.toString()
}
