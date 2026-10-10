import crc32c

# Untimed, once per fixture: the hex string becomes bytes.
def prepare(value):
    return bytes.fromhex(value)

def operation(value):
    return crc32c.crc32c(value)
