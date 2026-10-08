import jp from 'jsonpath'
export const operation = ({ document, query }) => jp.query(document, query)
