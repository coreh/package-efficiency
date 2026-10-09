import merge from 'merge-descriptors'
export const operation = (sources) => {
  const result = {}
  for (const source of sources) merge(result, source)
  return result
}
