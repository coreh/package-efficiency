import parseJson from 'parse-json'
export const operation = (text) => {
  try { return parseJson(text) } catch { return null }
}
