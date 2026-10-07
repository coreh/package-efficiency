import { create } from 'xmlbuilder'
const add = (parent, node) => {
  if (node.children) {
    const element = parent.ele(node.name, node.attrs)
    for (const child of node.children) add(element, child)
  } else parent.ele(node.name, node.attrs, node.text)
}
export const operation = (doc) => {
  const root = create(doc.name).att(doc.attrs)
  for (const child of doc.children) add(root, child)
  return root.end()
}
