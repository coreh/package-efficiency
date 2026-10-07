import { Graph, alg } from '@dagrejs/graphlib'
export const operation = ({ nodes, edges }) => {
  const graph = new Graph()
  for (const node of nodes) graph.setNode(node)
  for (const [before, after] of edges) graph.setEdge(before, after)
  return alg.topsort(graph)
}
