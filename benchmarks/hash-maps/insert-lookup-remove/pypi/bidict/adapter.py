from bidict import bidict


def side(keys, probes, weight):
    m = bidict()
    for i, k in enumerate(keys):
        m[k] = i
    size = len(m)
    hits = 0
    found = 0
    for p in probes:
        v = m.get(p)
        if v is not None:
            hits += 1
            found += v
    ksum = 0
    vsum = 0
    for k, v in m.items():
        ksum += weight(k)
        vsum += v
    for i in range(0, len(keys), 2):
        m.pop(keys[i], None)
    count = len(m)
    left = 0
    for p in probes:
        if p in m:
            left += 1
    return [size, hits, found, ksum, vsum, count, left]


def identity(k):
    return k


def operation(value):
    return side(value["ints"], value["intProbes"], identity) + side(value["strings"], value["stringProbes"], len)
