import { GenMapping, addMapping, toEncodedMap } from '@jridgewell/gen-mapping'
export const operation = ({ file, sources, names, mappings }) => {
  const map = new GenMapping({ file })
  for (const m of mappings) {
    addMapping(map, { generated: { line: m[0] + 1, column: m[1] }, source: sources[m[2]], original: { line: m[3] + 1, column: m[4] }, name: m[5] < 0 ? undefined : names[m[5]] })
  }
  return toEncodedMap(map)
}
