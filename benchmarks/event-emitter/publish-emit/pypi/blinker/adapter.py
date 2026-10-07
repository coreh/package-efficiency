from blinker import Signal

def operation(input):
    total = 0
    def make(j):
        def listener(sender, a, b):
            nonlocal total
            total += a * (j + 1) - b
        return listener
    signals = {}
    lists = {}
    for name in input["names"]:
        sig = Signal()
        ls = [make(j) for j in range(10)]
        for f in ls:
            sig.connect(f)
        signals[name] = sig
        lists[name] = ls
    events = input["events"]
    half = len(events) >> 1
    for i in range(half):
        name, a, b = events[i]
        target = signals.get(name)
        if target is not None:
            target.send(None, a=a, b=b)
    for name, s in signals.items():
        s.disconnect(lists[name][0])
        s.disconnect(lists[name][5])
    for i in range(half, len(events)):
        name, a, b = events[i]
        target = signals.get(name)
        if target is not None:
            target.send(None, a=a, b=b)
    return total
