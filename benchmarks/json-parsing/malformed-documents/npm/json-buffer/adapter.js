import { parse } from 'json-buffer'
export const operation = (text) => {
  try { return parse(text) } catch { return null }
}
