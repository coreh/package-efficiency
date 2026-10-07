import querystring from 'node:querystring'
export const operation = (input) => querystring.parse(input)
