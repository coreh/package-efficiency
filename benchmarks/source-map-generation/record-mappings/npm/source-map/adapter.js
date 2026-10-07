import sourceMap from 'source-map'
const { SourceMapGenerator } = sourceMap
export const operation = ({ file, sources, names, mappings }) => {
  const generator = new SourceMapGenerator({ file })
  for (const m of mappings) {
    generator.addMapping({ generated: { line: m[0] + 1, column: m[1] }, source: sources[m[2]], original: { line: m[3] + 1, column: m[4] }, name: m[5] < 0 ? undefined : names[m[5]] })
  }
  return generator.toJSON()
}
