import process from 'node:process'
import jsonpatch from 'fast-json-patch'
// As documented: applyPatch(document, patch) edits the parsed document in
// place. The variant passes validateOperation = true.
const validate = process.env.BENCH_FAST_JSON_PATCH === 'validate'
export const operation = ({ document, patch }) => {
  try {
    return JSON.stringify(jsonpatch.applyPatch(JSON.parse(document), JSON.parse(patch), validate).newDocument)
  } catch {
    return null
  }
}
