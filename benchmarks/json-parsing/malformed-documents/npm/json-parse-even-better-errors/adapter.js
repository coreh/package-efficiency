import parseJson from 'json-parse-even-better-errors'
export const operation = (text) => {
  try { return parseJson(text) } catch { return null }
}
