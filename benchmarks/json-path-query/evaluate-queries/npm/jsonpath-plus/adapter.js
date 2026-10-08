import { JSONPath } from 'jsonpath-plus'
export const operation = ({ document, query }) => JSONPath({ path: query, json: document })
