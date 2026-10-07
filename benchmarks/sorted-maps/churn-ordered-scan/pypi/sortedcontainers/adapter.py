from sortedcontainers import SortedDict

_MISSING = object()

def operation(value):
    m = SortedDict()
    for i, k in enumerate(value["keys"]):
        m[k] = i
    removed = [m.pop(k, _MISSING) is not _MISSING for k in value["removals"]]
    return [removed, list(m.values())]
