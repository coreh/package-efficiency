import networkx as nx

def operation(value):
    graph = nx.DiGraph()
    graph.add_nodes_from(value['nodes'])
    graph.add_edges_from(value['edges'])
    return list(nx.topological_sort(graph))
