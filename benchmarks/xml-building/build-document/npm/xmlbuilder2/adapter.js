import { create } from 'xmlbuilder2'
const add = (parent, node) => {
  const element = parent.ele(node.name, node.attrs)
  if (node.children) for (const child of node.children) add(element, child)
  else element.txt(node.text)
}
export const operation = (doc) => {
  const root = create()
  add(root, doc)
  return root.end()
}
