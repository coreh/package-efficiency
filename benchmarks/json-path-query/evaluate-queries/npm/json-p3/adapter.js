import { jsonpath } from 'json-p3'
export const operation = ({ document, query }) => jsonpath.query(query, document).values()
