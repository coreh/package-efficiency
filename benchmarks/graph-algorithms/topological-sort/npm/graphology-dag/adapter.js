import { DirectedGraph } from 'graphology'
import { topologicalSort } from 'graphology-dag'
export const operation = ({ nodes, edges }) => {
  const graph = new DirectedGraph()
  for (const node of nodes) graph.addNode(node)
  for (const [before, after] of edges) graph.addEdge(before, after)
  return topologicalSort(graph)
}
