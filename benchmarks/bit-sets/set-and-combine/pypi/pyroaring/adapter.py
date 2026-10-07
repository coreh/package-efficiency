from pyroaring import BitMap


def operation(value):
    a = BitMap(value["a"])
    b = BitMap(value["b"])
    return [len(a), len(b), len(a | b), len(a & b)]
