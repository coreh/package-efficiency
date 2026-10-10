import blake3

# Untimed, once per fixture: the hex string becomes bytes.
def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    return blake3.blake3(data).digest()

def describe(result):
    return list(result)
