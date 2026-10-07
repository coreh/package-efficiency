import locket

def operation(input):
    path = input['path']
    held = 0
    freed = 0
    for _ in range(input['cycles']):
        a = locket.lock_file(path)
        a.acquire()
        b = locket.lock_file(path, timeout=0)
        try:
            b.acquire()
            held += 1
            b.release()
        except locket.LockError:
            pass
        a.release()
        try:
            b.acquire()
            freed += 1
            b.release()
        except locket.LockError:
            pass
    return [held, freed]
