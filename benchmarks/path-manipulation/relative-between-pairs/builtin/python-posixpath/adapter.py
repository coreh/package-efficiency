import posixpath
def operation(value):
    return posixpath.relpath(value[1], value[0])
