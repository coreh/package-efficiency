from graphlib import TopologicalSorter

def operation(value):
    sorter = TopologicalSorter()
    for node in value['nodes']:
        sorter.add(node)
    for before, after in value['edges']:
        sorter.add(after, before)
    return list(sorter.static_order())
