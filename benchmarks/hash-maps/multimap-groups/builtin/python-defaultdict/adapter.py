from collections import defaultdict


def operation(value):
    groups = defaultdict(list)
    for k, v in zip(value["keys"], value["values"]):
        groups[k].append(v)
    for k in value["remove"]:
        groups.pop(k, None)
    empty = []
    return [groups.get(k, empty) for k in value["read"]]
