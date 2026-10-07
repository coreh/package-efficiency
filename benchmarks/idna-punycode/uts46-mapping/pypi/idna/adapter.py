import idna
def operation(value):
    return idna.encode(value).decode('ascii')
