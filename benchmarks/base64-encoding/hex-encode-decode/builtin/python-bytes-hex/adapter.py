# Untimed, once per fixture: the list of byte values becomes bytes.
def prepare(value):
    return bytes(value)

def operation(value):
    text = value.hex()
    return (text, bytes.fromhex(text))

# bytes are not JSON; a list of byte values for the verifier, outside measured work.
def describe(result):
    return [result[0], list(result[1])]
