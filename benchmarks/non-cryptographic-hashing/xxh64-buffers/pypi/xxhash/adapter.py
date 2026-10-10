import xxhash

# Untimed, once per fixture: the hex string becomes bytes.
def prepare(value):
    return bytes.fromhex(value)

def operation(value):
    return xxhash.xxh64_intdigest(value)

# Untimed, once per fixture: the int as an unsigned decimal string, because a
# JSON number above 2^53 would lose its low bits.
def describe(result):
    return str(result)
