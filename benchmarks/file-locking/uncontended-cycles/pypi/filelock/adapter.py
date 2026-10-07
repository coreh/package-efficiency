from filelock import FileLock, Timeout

def operation(input):
    path = input['path']
    held = 0
    freed = 0
    for _ in range(input['cycles']):
        a = FileLock(path)
        a.acquire()
        b = FileLock(path)
        try:
            b.acquire(timeout=0)
            held += 1
            b.release()
        except Timeout:
            pass
        a.release()
        try:
            b.acquire(timeout=0)
            freed += 1
            b.release()
        except Timeout:
            pass
    return [held, freed]
