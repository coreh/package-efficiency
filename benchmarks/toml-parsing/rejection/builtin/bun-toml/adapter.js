export const operation = (text) => {
  try {
    Bun.TOML.parse(text)
    return true
  } catch {
    return false
  }
}
