from pyee import EventEmitter

def operation(input):
    total = 0
    def make(j):
        def listener(a, b):
            nonlocal total
            total += a * (j + 1) - b
        return listener
    ee = EventEmitter()
    lists = {}
    for name in input["names"]:
        ls = [make(j) for j in range(10)]
        lists[name] = ls
        for f in ls:
            ee.on(name, f)
    events = input["events"]
    half = len(events) >> 1
    for i in range(half):
        name, a, b = events[i]
        ee.emit(name, a, b)
    for name, ls in lists.items():
        ee.remove_listener(name, ls[0])
        ee.remove_listener(name, ls[5])
    for i in range(half, len(events)):
        name, a, b = events[i]
        ee.emit(name, a, b)
    return total
