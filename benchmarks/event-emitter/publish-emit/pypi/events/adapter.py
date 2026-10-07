from events import Events

def operation(input):
    total = 0
    def make(j):
        def listener(a, b):
            nonlocal total
            total += a * (j + 1) - b
        return listener
    ev = Events()
    names = input["names"]
    lists = {}
    for name in names:
        ls = [make(j) for j in range(10)]
        lists[name] = ls
        slot = getattr(ev, name)
        for f in ls:
            slot += f
    known = set(names)
    events = input["events"]
    half = len(events) >> 1
    for i in range(half):
        name, a, b = events[i]
        if name in known:
            getattr(ev, name)(a, b)
    for name, ls in lists.items():
        slot = getattr(ev, name)
        slot -= ls[0]
        slot -= ls[5]
    for i in range(half, len(events)):
        name, a, b = events[i]
        if name in known:
            getattr(ev, name)(a, b)
    return total
