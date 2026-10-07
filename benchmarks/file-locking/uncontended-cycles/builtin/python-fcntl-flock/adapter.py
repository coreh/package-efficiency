import fcntl

def operation(input):
    path = input['path']
    held = 0
    freed = 0
    for _ in range(input['cycles']):
        a = open(path, 'a')
        fcntl.flock(a, fcntl.LOCK_EX)
        b = open(path, 'a')
        try:
            fcntl.flock(b, fcntl.LOCK_EX | fcntl.LOCK_NB)
            held += 1
            fcntl.flock(b, fcntl.LOCK_UN)
        except BlockingIOError:
            pass
        fcntl.flock(a, fcntl.LOCK_UN)
        try:
            fcntl.flock(b, fcntl.LOCK_EX | fcntl.LOCK_NB)
            freed += 1
            fcntl.flock(b, fcntl.LOCK_UN)
        except BlockingIOError:
            pass
        a.close()
        b.close()
    return [held, freed]
