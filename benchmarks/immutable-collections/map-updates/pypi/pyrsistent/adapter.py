from pyrsistent import pmap


def operation(value):
    keep = value['keep']
    m = pmap(value['entries'])
    kept = [m] if 0 in keep else []
    for n, op in enumerate(value['ops'], 1):
        if op[0] == 'set':
            m = m.set(op[1], op[2])
        else:
            m = m.remove(op[1])
        if n in keep:
            kept.append(m)
    lookups = value['lookups']
    return [[len(v), [v.get(k) for k in lookups]] for v in kept]
