from sortedcontainers import SortedDict

def operation(value):
    m = SortedDict()
    for i, k in enumerate(value["keys"]):
        m[k] = i
    found = [m.get(k) for k in value["lookups"]]
    scans = []
    for p in value["prefixes"]:
        out = []
        for k in m.irange(minimum=p):
            if not k.startswith(p):
                break
            out.append(m[k])
        scans.append(out)
    return [found, scans]
