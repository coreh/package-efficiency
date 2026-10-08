import { immutableJSONPatch } from 'immutable-json-patch'
export const operation = ({ document, patch }) => {
  try {
    return JSON.stringify(immutableJSONPatch(JSON.parse(document), JSON.parse(patch)))
  } catch {
    return null
  }
}
