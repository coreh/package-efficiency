import { parseDocument } from 'htmlparser2'
import { selectAll } from 'css-select'
// Untimed, once per fixture: the document is parsed (and shared between fixtures).
const parsed = new Map()
export const prepare = ({ html, selector }) => {
  let document = parsed.get(html)
  if (!document) parsed.set(html, document = parseDocument(html))
  return { document, selector }
}
export const operation = ({ document, selector }) => selectAll(selector, document)
