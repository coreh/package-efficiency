import { RedBlackTree } from '@std/data-structures/red-black-tree'
const compare = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
export const operation = ({ keys, removals }) => {
  const tree = new RedBlackTree(compare)
  for (let i = 0; i < keys.length; i++) tree.insert([keys[i], i])
  const removed = removals.map((key) => tree.remove([key, 0]))
  const ordered = []
  for (const entry of tree) ordered.push(entry[1])
  return [removed, ordered]
}
