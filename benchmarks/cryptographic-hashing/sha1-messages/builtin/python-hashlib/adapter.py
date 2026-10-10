import hashlib

# Untimed, once per fixture: the hex string becomes bytes.
def prepare(value):
    return bytes.fromhex(value)

def operation(value):
    return hashlib.sha1(value).digest()

def describe(result):
    return list(result)
