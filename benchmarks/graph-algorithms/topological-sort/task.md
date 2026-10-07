# Topological sort

One operation is given a directed acyclic graph as plain data, `{ nodes, edges }`
(node names, and `[before, after]` pairs of names), builds the library's graph
from it and returns the nodes in a topological order: a list of names in which
every edge's first node comes before its second.

The 12 graphs have 20 to 3,000 nodes and 25 to 5,300 edges and are generated
deterministically in the shape of a dependency graph: most edges join nodes
that are close in the hidden order, some reach far back, about one node in ten
has no incoming edge and a few have no edge at all. The node list and the edge
list are shuffled; the scenario checks at load that neither the node list nor
its reverse is a valid answer.

## What counts as correct

A graph has many topological orders, and each library returns its own
(depth-first or breadth-first, from sources or from sinks). There is no output
to compare with, so the verifier checks the properties that make an order
correct, and accepts any order that has them:

- it lists every node of the fixture exactly once, and nothing else;
- for every edge, the first node is at an earlier position than the second.

Building the graph is inside the timed call in every entry: that is how the
libraries are used (one takes the lists directly), and it keeps the work the
same. Nothing is kept between calls.

## Packages

- `toposort`: `toposort.array(nodes, edges)`.
- `@dagrejs/graphlib`: `new Graph()`, `setNode`, `setEdge`, `alg.topsort(graph)`.
- `graphology-dag` (with `graphology`): `new DirectedGraph()`, `addNode`,
  `addEdge`, `topologicalSort(graph)`.
- `petgraph` (Rust): a `DiGraph<&str, ()>` with a `HashMap` from name to node
  index for the edges, then `algo::toposort`. The order comes back as node
  indexes; they are turned into names for the verifier outside the timed call
  (an index is the position of the name in the fixture).
- Standard library: Python `graphlib.TopologicalSorter` (`add`,
  `static_order`); Ruby `TSort.tsort` over a hash of predecessors built in the
  call. JavaScript and Go have none.

Not included yet: PyPI `networkx`, which can be added when PyPI packages can
be adapters. Strongly connected components would be a second task with the same
kind of check (compare the components as a set of sets of nodes): `petgraph`,
`@dagrejs/graphlib`, `graphology-components`, `networkx` and Ruby `TSort` do
it; Python's `graphlib` does not.

See [shared methodology](../../README.md) for timing and reproduction.
