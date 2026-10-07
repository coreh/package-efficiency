import { createHighlighter } from 'shiki'
const highlighter = await createHighlighter({ themes: ['github-dark'], langs: ['javascript', 'python'] })
export const operation = ({ language, code }) => highlighter.codeToHtml(code, { lang: language, theme: 'github-dark' })
