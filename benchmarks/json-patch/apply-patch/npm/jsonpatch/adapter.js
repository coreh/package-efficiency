import jsonpatch from 'jsonpatch'
export const operation = ({ document, patch }) => {
  try {
    return JSON.stringify(jsonpatch.apply_patch(JSON.parse(document), JSON.parse(patch)))
  } catch {
    return null
  }
}
