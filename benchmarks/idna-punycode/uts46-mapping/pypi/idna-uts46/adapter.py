import idna
def operation(value):
    return idna.encode(value, uts46=True).decode('ascii')
