from Crypto.Cipher import Salsa20

# Untimed, once per fixture: the three strings become bytes.
def prepare(value):
    return tuple(value[k].encode('utf-8') for k in ('key', 'nonce', 'text'))

def operation(value):
    key, nonce, text = value
    return Salsa20.new(key=key, nonce=nonce).encrypt(text)

def describe(result):
    return result.hex()
