import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/index.js'
loadLanguages(['python'])
export const operation = ({ language, code }) => Prism.highlight(code, Prism.languages[language], language)
