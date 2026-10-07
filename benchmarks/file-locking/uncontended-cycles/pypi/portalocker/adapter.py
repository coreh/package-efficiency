import portalocker

def operation(input):
    path = input['path']
    held = 0
    freed = 0
    for _ in range(input['cycles']):
        a = portalocker.Lock(path)
        a.acquire()
        b = portalocker.Lock(path, timeout=0, fail_when_locked=True)
        try:
            b.acquire()
            held += 1
            b.release()
        except portalocker.AlreadyLocked:
            pass
        a.release()
        try:
            b.acquire()
            freed += 1
            b.release()
        except portalocker.AlreadyLocked:
            pass
    return [held, freed]
