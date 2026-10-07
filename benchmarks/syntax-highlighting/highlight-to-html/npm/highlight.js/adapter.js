import hljs from 'highlight.js'
export const operation = ({ language, code }) => hljs.highlight(code, { language }).value
