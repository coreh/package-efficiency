from bitarray import bitarray
from bitarray.util import zeros


def operation(value):
    size = value["size"]
    a = zeros(size)
    b = zeros(size)
    for p in value["a"]:
        a[p] = 1
    for p in value["b"]:
        b[p] = 1
    return [a.count(), b.count(), (a | b).count(), (a & b).count()]
