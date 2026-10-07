import { parse } from '@std/toml'
export const operation = (text) => {
  try {
    parse(text)
    return true
  } catch {
    return false
  }
}
