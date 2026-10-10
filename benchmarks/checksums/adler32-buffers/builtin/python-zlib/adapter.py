import zlib

# Untimed, once per fixture: the hex string becomes bytes.
def prepare(value):
    return bytes.fromhex(value)

def operation(value):
    return zlib.adler32(value)
