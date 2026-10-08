import { applyPatch } from 'rfc6902'
// applyPatch edits the document in place and returns one entry per operation:
// null for success, an Error otherwise.
export const operation = ({ document, patch }) => {
  const doc = JSON.parse(document)
  const results = applyPatch(doc, JSON.parse(patch))
  return results.some((error) => error !== null) ? null : JSON.stringify(doc)
}
