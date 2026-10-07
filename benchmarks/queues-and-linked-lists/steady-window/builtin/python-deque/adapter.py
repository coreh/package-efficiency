from collections import deque

def operation(value):
    window, items = value
    queue = deque()
    out = []
    for item in items:
        queue.append(item)
        if len(queue) > window:
            out.append(queue.popleft())
    held = len(queue)
    while queue:
        out.append(queue.popleft())
    out.append(held)
    return out
