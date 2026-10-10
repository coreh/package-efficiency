from multidict import MultiDict


def operation(value):
    groups = MultiDict()
    for k, v in zip(value["keys"], value["values"]):
        groups.add(k, v)
    for k in value["remove"]:
        groups.popall(k, None)
    empty = []
    return [groups.getall(k, empty) for k in value["read"]]
