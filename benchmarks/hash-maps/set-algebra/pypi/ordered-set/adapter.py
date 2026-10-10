from ordered_set import OrderedSet


def operation(value):
    a = OrderedSet(value["a"])
    b = OrderedSet(value["b"])
    return [a | b, a & b, a - b]


def describe(result):
    return [list(s) for s in result]
