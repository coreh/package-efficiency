import { Table } from '@cliffy/table'
export const operation = ({ headers, rows }) => new Table().header(headers.map(String)).body(rows.map((r) => r.map(String))).toString()
