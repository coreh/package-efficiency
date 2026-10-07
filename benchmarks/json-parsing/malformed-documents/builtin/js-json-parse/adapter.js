export const operation = (text) => {
  try { return JSON.parse(text) } catch { return null }
}
