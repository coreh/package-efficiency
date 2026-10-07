from collections import deque

def operation(items):
    dq = deque()
    out = []
    for x in items:
        op = x & 3
        if op == 0:
            dq.append(x)
        elif op == 1:
            dq.appendleft(x)
        elif dq:
            out.append(dq.popleft() if op == 2 else dq.pop())
    out.append(-1)
    while dq:
        out.append(dq.popleft())
    return out
