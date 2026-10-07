import { marked } from 'marked'
export const operation = (text) => marked.parse(text)
