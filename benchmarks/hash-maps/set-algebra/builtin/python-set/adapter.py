def operation(value):
    a = set(value["a"])
    b = set(value["b"])
    return [a | b, a & b, a - b]


def describe(result):
    return [list(s) for s in result]
