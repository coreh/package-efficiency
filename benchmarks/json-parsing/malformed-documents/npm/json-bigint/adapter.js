import JSONbig from 'json-bigint'
export const operation = (text) => {
  try { return JSONbig.parse(text) } catch { return null }
}
