from pyee import EventEmitter

def operation(input):
    total = 0
    def make(j):
        def listener(a, b):
            nonlocal total
            total += a * (j + 1) - b
        return listener
    ee = EventEmitter()
    names = input["names"]
    for name in names:
        for j in range(6):
            (ee.on if j % 2 == 0 else ee.once)(name, make(j))
    events = input["events"]
    half = len(events) >> 1
    for i in range(half):
        name, a, b = events[i]
        ee.emit(name, a, b)
    for name in names:
        for j in (1, 3, 5):
            ee.once(name, make(j))
    for i in range(half, len(events)):
        name, a, b = events[i]
        ee.emit(name, a, b)
    return total
