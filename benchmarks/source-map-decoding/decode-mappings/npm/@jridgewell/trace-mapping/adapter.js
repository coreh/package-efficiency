import { TraceMap, eachMapping } from '@jridgewell/trace-mapping'
export const operation = (map) => {
  const out = []
  eachMapping(new TraceMap(map), (m) => { out.push(m) })
  return out
}
