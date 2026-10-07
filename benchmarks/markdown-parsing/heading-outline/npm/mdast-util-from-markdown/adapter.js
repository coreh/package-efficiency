import { fromMarkdown } from 'mdast-util-from-markdown'
export const operation = (text) => {
  const out = []
  for (const node of fromMarkdown(text).children) {
    if (node.type === 'heading') out.push([node.depth, node.children[0].value])
  }
  return out
}
