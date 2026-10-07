import { marked } from 'marked'
export const operation = (text) => {
  const out = []
  for (const token of marked.lexer(text)) {
    if (token.type === 'heading') out.push([token.depth, token.text])
  }
  return out
}
