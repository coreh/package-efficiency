import mmh3
def operation(value):
    return mmh3.hash(value, 0, False)
