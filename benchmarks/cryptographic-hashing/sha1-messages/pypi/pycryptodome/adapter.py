from Crypto.Hash import SHA1

# Untimed, once per fixture: the hex string becomes bytes.
def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    return SHA1.new(data).digest()

def describe(result):
    return list(result)
