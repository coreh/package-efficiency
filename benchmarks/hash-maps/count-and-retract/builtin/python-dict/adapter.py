def side(events, drops, weight):
    m = {}
    for k in events:
        m[k] = m.get(k, 0) + 1
    mx = 0
    sq = 0
    ws = 0
    for k, c in m.items():
        if c > mx:
            mx = c
        sq += c * c
        ws += weight(k) * c
    distinct = len(m)
    for k in drops:
        c = m.get(k)
        if c is None:
            continue
        if c == 1:
            del m[k]
        else:
            m[k] = c - 1
    total = 0
    for c in m.values():
        total += c
    return [distinct, mx, sq, ws, len(m), total]


def identity(k):
    return k


def operation(value):
    return side(value["ints"], value["intRetracts"], identity) + side(value["strings"], value["stringRetracts"], len)
