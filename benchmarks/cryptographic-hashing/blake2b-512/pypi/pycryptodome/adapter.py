from Crypto.Hash import BLAKE2b

# Untimed, once per fixture: the hex string becomes bytes.
def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    return BLAKE2b.new(digest_bits=512, data=data).digest()

def describe(result):
    return list(result)
