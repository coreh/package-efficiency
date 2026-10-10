from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

# Untimed, once per fixture: the three strings become bytes.
def prepare(value):
    return tuple(value[k].encode('utf-8') for k in ('key', 'iv', 'text'))

def operation(value):
    key, iv, text = value
    # A CBC object keeps chaining state, so each call builds its own.
    return AES.new(key, AES.MODE_CBC, iv).encrypt(pad(text, 16))

def describe(result):
    return result.hex()
