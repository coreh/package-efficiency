# Untimed, once per fixture: the hex string becomes the byte buffer.
def prepare(value):
    return bytes.fromhex(value)


def operation(value):
    return value.decode('utf-8', 'replace')
