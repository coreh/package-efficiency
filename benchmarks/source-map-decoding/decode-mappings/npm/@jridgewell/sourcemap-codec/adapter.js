import { decode } from '@jridgewell/sourcemap-codec'
export const operation = (map) => {
  const lines = decode(map.mappings), { sources, names } = map, out = []
  for (let i = 0; i < lines.length; i++) {
    for (const s of lines[i]) {
      out.push({
        generatedLine: i + 1,
        generatedColumn: s[0],
        source: s.length > 1 ? sources[s[1]] : null,
        originalLine: s.length > 1 ? s[2] + 1 : null,
        originalColumn: s.length > 1 ? s[3] : null,
        name: s.length > 4 ? names[s[4]] : null,
      })
    }
  }
  return out
}
