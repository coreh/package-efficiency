from pyroaring import BitMap


def operation(value):
    a = BitMap(value["a"])
    b = BitMap(value["b"])
    return [list(a - b), list(a ^ b)]
