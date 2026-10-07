import { SourceMapConsumer } from 'source-map-js'
export const operation = (map) => {
  const out = []
  new SourceMapConsumer(map).eachMapping((m) => { out.push(m) })
  return out
}
