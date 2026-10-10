import jsonpatch from 'fast-json-patch'
const { getValueByPointer } = jsonpatch
export const operation = ({ document, pointers }) =>
  pointers.map((pointer) => {
    try {
      return getValueByPointer(document, pointer) ?? null
    } catch {
      return null
    }
  })
