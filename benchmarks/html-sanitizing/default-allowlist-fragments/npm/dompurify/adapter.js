import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
// DOMPurify needs a DOM; under Node it is given a jsdom window, once.
const DOMPurify = createDOMPurify(new JSDOM('').window)
export const operation = (html) => DOMPurify.sanitize(html)
