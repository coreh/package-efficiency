import merge from 'utils-merge'
export const operation = (sources) => {
  const result = {}
  for (const source of sources) merge(result, source)
  return result
}
