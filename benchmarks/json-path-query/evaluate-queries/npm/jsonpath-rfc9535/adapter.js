import { query } from 'jsonpath-rfc9535'
export const operation = (input) => query(input.document, input.query)
